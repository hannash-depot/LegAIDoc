import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  console.log('URL:', process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:');
    res.rows.forEach((r: { table_name: string }) => console.log(r.table_name));
  } catch (err) {
    console.error('Error querying db:', err);
  } finally {
    await pool.end();
  }
}

main();
