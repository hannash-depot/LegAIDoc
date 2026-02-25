/**
 * One-off script to grant admin to hannashi@gmail.com and hanna.sh@gmail.com.
 * Run: npx tsx scripts/setup-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const ADMIN_EMAILS = ["hannashi@gmail.com", "hanna.sh@gmail.com"];

async function main() {
  const db = new PrismaClient();

  const { count } = await db.user.updateMany({
    where: { email: { in: ADMIN_EMAILS } },
    data: { isAdmin: true },
  });

  console.log(`Admin access granted to ${count} user(s): ${ADMIN_EMAILS.join(", ")}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
