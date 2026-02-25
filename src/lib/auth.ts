import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { consumeRateLimit, hashIdentifier } from "@/lib/security/rate-limit";
import { logApiWarn } from "@/lib/monitoring";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/dashboard",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request?.headers?.get("x-real-ip") ??
          "unknown";

        const ipLimit = consumeRateLimit({
          key: `auth:signin:ip:${ip}`,
          limit: 20,
          windowMs: 15 * 60 * 1000,
        });
        if (!ipLimit.success) {
          logApiWarn("auth.signin.rate_limited_ip", {
            route: "auth.credentials.authorize",
            ip,
          });
          return null;
        }

        const emailLimit = consumeRateLimit({
          key: `auth:signin:email:${hashIdentifier(email)}`,
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });
        if (!emailLimit.success) {
          logApiWarn("auth.signin.rate_limited_email", {
            route: "auth.credentials.authorize",
            ip,
          });
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Always fetch isAdmin from DB on sign-in and session updates
      // (OAuth adapters strip custom fields from the user object)
      if ((user || trigger === "update") && token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { isAdmin: true },
        });
        token.isAdmin = dbUser?.isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
  },
});
