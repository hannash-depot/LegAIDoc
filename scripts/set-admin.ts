import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'hanna.sh@gmail.com';
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: {
        email,
        name: 'Hanna',
        role: 'ADMIN',
        // Dummy password since it might be OAuth or they'll reset it
        hashedPassword: '',
        preferredLocale: 'he',
      },
    });
    console.log(`Successfully updated/created user ${email} with role ${user.role}`);
  } catch (err) {
    console.error('Error updating user role:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
