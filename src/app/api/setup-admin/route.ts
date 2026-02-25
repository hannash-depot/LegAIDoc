import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_EMAIL = "hanna.sh@gmail.com";

export async function GET() {
  try {
    const adminCount = await db.user.count({ where: { isAdmin: true } });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Setup already completed. An admin user already exists." },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${ADMIN_EMAIL}` },
        { status: 404 }
      );
    }

    await db.user.update({
      where: { email: ADMIN_EMAIL },
      data: { isAdmin: true },
    });

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
