import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const adminCount = await db.user.count({ where: { isAdmin: true } });

  if (adminCount > 0) {
    return NextResponse.json(
      { error: "Setup already completed. An admin user already exists." },
      { status: 403 }
    );
  }

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await db.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  return NextResponse.json({ success: true, message: `Admin access granted to ${email}` });
}
