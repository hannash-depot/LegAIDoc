import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import { buildRequestContext, logApiError, logApiWarn } from "@/lib/monitoring";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  const requestContext = buildRequestContext(
    request,
    "api.user.change_password"
  );
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("user.change_password.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `user:change-password:${session.user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("user.change_password.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(
      limit,
      "Too many password change attempts. Please try again later."
    );
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return NextResponse.json(
        { error: "Password change not available for OAuth accounts" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    await logApiError("user.change_password.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
