import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const user = await db.user.findUnique({
    where: { email: "hanna.sh@gmail.com" },
  });

  if (!user) {
    console.log("User not found with email hanna.sh@gmail.com");
    console.log("Listing all users:");
    const users = await db.user.findMany({ select: { id: true, email: true, name: true, isAdmin: true } });
    console.log(JSON.stringify(users, null, 2));
    return;
  }

  const updated = await db.user.update({
    where: { email: "hanna.sh@gmail.com" },
    data: { isAdmin: true },
  });

  console.log(`Admin access granted to: ${updated.email} (isAdmin: ${updated.isAdmin})`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
