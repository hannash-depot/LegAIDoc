import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_EMAILS = ["hannashi@gmail.com", "hanna.sh@gmail.com"];

export async function GET() {
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

    return NextResponse.json({
      success: true,
      message: `Admin access granted to ${foundEmails.join(", ")}`,
      missingEmails,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
