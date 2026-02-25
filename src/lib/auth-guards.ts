import { auth } from "./auth";
import { NextResponse } from "next/server";

/**
 * Verifies that the current request is from an authenticated admin user.
 * Returns the session if valid, or a NextResponse error.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null };
}
