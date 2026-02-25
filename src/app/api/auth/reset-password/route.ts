import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  consumeRateLimit,
  hashIdentifier,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import { buildRequestContext, logApiError, logApiWarn } from "@/lib/monitoring";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(100),
});

export async function POST(request: Request) {
  const requestContext = buildRequestContext(request, "api.auth.reset_password");
  const ipLimit = consumeRateLimit({
    key: `auth:reset:ip:${requestContext.ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.success) {
    logApiWarn("auth.reset_password.rate_limited_ip", {
      ...requestContext,
      retryAfterSeconds: ipLimit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(
      ipLimit,
      "Too many password reset attempts. Please try again later."
    );
  }

  try {
    const body = await request.json();
    const { token, email, password } = resetPasswordSchema.parse(body);

    const tokenLimit = consumeRateLimit({
      key: `auth:reset:token:${hashIdentifier(token)}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!tokenLimit.success) {
      logApiWarn("auth.reset_password.rate_limited_token", {
        ...requestContext,
        retryAfterSeconds: tokenLimit.retryAfterSeconds,
      });
      return rateLimitExceededResponse(
        tokenLimit,
        "Too many attempts for this reset link. Please request a new one."
      );
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: email,
        token,
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token,
          },
        },
      });
      return NextResponse.json(
        { error: "Reset link has expired" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { email },
      data: { hashedPassword },
    });

    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    await logApiError("auth.reset_password.failed", error, requestContext);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
