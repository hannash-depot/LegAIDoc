import { clearDbData, seedTestUser } from './tests/test-utils';

async function main() {
  try {
    console.log('Clearing DB...');
    await clearDbData();
    console.log('Seeding user...');
    await seedTestUser();
    console.log('Done.');
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
