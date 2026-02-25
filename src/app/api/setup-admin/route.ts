import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import {
  buildRequestContext,
  logApiError,
  logApiWarn,
  logApiInfo,
} from "@/lib/monitoring";

const ADMIN_EMAILS = ["hannashi@gmail.com", "hanna.sh@gmail.com"];

export async function GET(request: Request) {
  const requestContext = buildRequestContext(request, "api.setup_admin");
  const token = request.headers.get("x-setup-admin-token");
  const expectedToken = process.env.SETUP_ADMIN_TOKEN;

  const limit = consumeRateLimit({
    key: `setup-admin:ip:${requestContext.ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("setup_admin.rate_limited", {
      ...requestContext,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(limit);
  }

  if (!expectedToken || token !== expectedToken) {
    logApiWarn("setup_admin.forbidden", requestContext);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Add isAdmin column if it doesn't exist yet
    await db.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false
    `);

    // Reset any previous wrong admin grants, then set the correct one
    await db.$executeRawUnsafe(`UPDATE "users" SET "isAdmin" = false WHERE "isAdmin" = true`);

    // Find and promote all allowed admins
    const users = await db.user.findMany({
      where: { email: { in: ADMIN_EMAILS } },
      select: { id: true, email: true },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: `No matching users found for: ${ADMIN_EMAILS.join(", ")}` },
        { status: 404 }
      );
    }

    await db.user.updateMany({
      where: { email: { in: ADMIN_EMAILS } },
      data: { isAdmin: true },
    });

    const foundEmails = users.map((u) => u.email);
    const missingEmails = ADMIN_EMAILS.filter((email) => !foundEmails.includes(email));

    logApiInfo("setup_admin.success", {
      ...requestContext,
      adminEmailsGranted: foundEmails,
    });

    return NextResponse.json({
      success: true,
      message: `Admin access granted to ${foundEmails.join(", ")}`,
      missingEmails,
    });
  } catch (error) {
    await logApiError("setup_admin.failed", error, requestContext);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
