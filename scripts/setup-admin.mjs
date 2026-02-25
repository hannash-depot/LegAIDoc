/**
 * One-off script to grant admin to hannashi@gmail.com and hanna.sh@gmail.com.
 * Run: node scripts/setup-admin.mjs
 */
import { PrismaClient } from "@prisma/client";

const ADMIN_EMAILS = ["hannashi@gmail.com", "hanna.sh@gmail.com"];

const db = new PrismaClient();

const { count } = await db.user.updateMany({
  where: { email: { in: ADMIN_EMAILS } },
  data: { isAdmin: true },
});

console.log(`Admin access granted to ${count} user(s): ${ADMIN_EMAILS.join(", ")}`);
await db.$disconnect();
