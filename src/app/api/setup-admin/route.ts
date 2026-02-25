import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_EMAIL = "hannashi@gmail.com";

export async function GET() {
  try {
    // Add isAdmin column if it doesn't exist yet
    await db.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false
    `);

    // Reset any previous wrong admin grants, then set the correct one
    await db.$executeRawUnsafe(`UPDATE "users" SET "isAdmin" = false WHERE "isAdmin" = true`);

    // Find and promote the user
    const users = await db.$queryRawUnsafe<{ id: string; email: string }[]>(
      `SELECT id, email FROM "users" WHERE email = $1`,
      ADMIN_EMAIL
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: `User not found: ${ADMIN_EMAIL}` },
        { status: 404 }
      );
    }

    await db.$executeRawUnsafe(
      `UPDATE "users" SET "isAdmin" = true WHERE email = $1`,
      ADMIN_EMAIL
    );

    return NextResponse.json({
      success: true,
      message: `Admin access granted to ${ADMIN_EMAIL}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
