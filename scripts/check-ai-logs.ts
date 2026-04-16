import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['ai.parse', 'ai.parse.error'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    console.log(JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
