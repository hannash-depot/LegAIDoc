import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import { buildRequestContext, logApiError, logApiWarn } from "@/lib/monitoring";

const profileSchema = z.object({
  name: z.string().min(2).max(100),
});

export async function PATCH(request: Request) {
  const requestContext = buildRequestContext(request, "api.user.profile");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("user.profile.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `user:profile:${session.user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("user.profile.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(limit);
  }

  try {
    const body = await request.json();
    const { name } = profileSchema.parse(body);

    await db.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    return NextResponse.json({ success: true, name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    await logApiError("user.profile.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
