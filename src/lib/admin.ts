import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }

  try {
    const rows = await db.$queryRawUnsafe<{ isAdmin: boolean }[]>(
      `SELECT "isAdmin" FROM "users" WHERE id = $1`,
      session.user.id
    );

    if (!rows[0]?.isAdmin) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
    }

    return { error: null, user: { id: session.user.id, isAdmin: true } };
  } catch {
    // isAdmin column may not exist yet -- fall back to forbidden
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  }
}
