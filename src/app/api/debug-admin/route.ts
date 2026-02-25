import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import {
  buildRequestContext,
  logApiError,
  logApiWarn,
} from "@/lib/monitoring";

export async function GET(request: Request) {
  const requestContext = buildRequestContext(request, "api.debug_admin");

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      logApiWarn("debug_admin.unauthorized", requestContext);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = consumeRateLimit({
      key: `debug-admin:user:${session.user.id}`,
      limit: 20,
      windowMs: 60 * 1000,
    });
    if (!limit.success) {
      logApiWarn("debug_admin.rate_limited", {
        ...requestContext,
        userId: session.user.id,
        retryAfterSeconds: limit.retryAfterSeconds,
      });
      return rateLimitExceededResponse(limit);
    }

    const sessionInfo = {
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      isAdminInSession: (session?.user as Record<string, unknown>)?.isAdmin ?? "NOT_PRESENT",
      fullSessionUser: session?.user ?? null,
    };

    let dbInfo: Record<string, unknown> = {};
    if (session?.user?.email) {
      try {
        const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT id, email, "isAdmin" FROM "users" WHERE email = $1`,
          session.user.email
        );
        dbInfo = {
          userFound: rows.length > 0,
          dbIsAdmin: rows[0]?.isAdmin ?? "NOT_FOUND",
          rawRow: rows[0] ?? null,
        };
      } catch (e) {
        dbInfo = { error: String(e) };
      }
    }

    let columnExists = false;
    try {
      const cols = await db.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isAdmin'`
      );
      columnExists = cols.length > 0;
    } catch (e) {
      columnExists = false;
    }

    return NextResponse.json({
      session: sessionInfo,
      database: dbInfo,
      columnExists,
    });
  } catch (error) {
    await logApiError("debug_admin.failed", error, requestContext);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
