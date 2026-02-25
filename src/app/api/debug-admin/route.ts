import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

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
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
