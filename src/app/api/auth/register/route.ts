import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import {
  buildRequestContext,
  logApiError,
  logApiInfo,
  logApiWarn,
} from "@/lib/monitoring";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/policy";

const registerSchema = z.object({
  name: z.string().min(2).max(100).transform((value) => value.trim()),
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(100),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
});

export async function POST(request: Request) {
  const requestContext = buildRequestContext(request, "api.auth.register");
  const limit = consumeRateLimit({
    key: `auth:register:ip:${requestContext.ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!limit.success) {
    logApiWarn("auth.register.rate_limited", {
      ...requestContext,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(
      limit,
      "Too many registration attempts. Please try again later."
    );
  }

  try {
    const body = await request.json();
    const { name, email, password } = registerSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logApiWarn("auth.register.email_exists", {
        ...requestContext,
        email,
      });
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const consentedAt = new Date();

    const user = await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
        acceptedTermsAt: consentedAt,
        acceptedTermsVersion: TERMS_VERSION,
        acceptedPrivacyAt: consentedAt,
        acceptedPrivacyVersion: PRIVACY_VERSION,
      },
    });

    logApiInfo("auth.register.success", {
      ...requestContext,
      userId: user.id,
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    await logApiError("auth.register.failed", error, requestContext);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
