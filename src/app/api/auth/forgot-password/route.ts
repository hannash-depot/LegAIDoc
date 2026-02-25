import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import {
  consumeRateLimit,
  hashIdentifier,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import {
  buildRequestContext,
  logApiError,
  logApiInfo,
  logApiWarn,
} from "@/lib/monitoring";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  locale: z.enum(["he", "ar", "en", "ru"]).default("en"),
});

export async function POST(request: Request) {
  const requestContext = buildRequestContext(request, "api.auth.forgot_password");
  const ipLimit = consumeRateLimit({
    key: `auth:forgot:ip:${requestContext.ip}`,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.success) {
    logApiWarn("auth.forgot_password.rate_limited_ip", {
      ...requestContext,
      retryAfterSeconds: ipLimit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(
      ipLimit,
      "Too many reset requests. Please try again later."
    );
  }

  try {
    const body = await request.json();
    const { email, locale } = forgotPasswordSchema.parse(body);

    const emailLimit = consumeRateLimit({
      key: `auth:forgot:email:${hashIdentifier(email)}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!emailLimit.success) {
      logApiWarn("auth.forgot_password.rate_limited_email", {
        ...requestContext,
        retryAfterSeconds: emailLimit.retryAfterSeconds,
      });
      return rateLimitExceededResponse(
        emailLimit,
        "Too many reset requests for this account. Please try again later."
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      logApiInfo("auth.forgot_password.request_unknown_email", requestContext);
      return NextResponse.json({ success: true });
    }

    // Delete any existing tokens for this user
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const resetUrl = `${baseUrl}/${locale}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail(email, resetUrl, locale);
    logApiInfo("auth.forgot_password.email_sent", {
      ...requestContext,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    await logApiError("auth.forgot_password.failed", error, requestContext);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
