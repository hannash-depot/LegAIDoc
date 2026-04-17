/**
 * Build-time hook: applies pending Prisma migrations and seeds production data.
 * Skips silently when DATABASE_URL is not set (local `next build` without a DB).
 * Safe to run on every Vercel deploy — migrations and seed are idempotent.
 */
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

if (!process.env.DATABASE_URL) {
  console.log('migrate-and-seed: DATABASE_URL not set, skipping.');
  process.exit(0);
}

const repoRoot = path.resolve(__dirname, '..');
const binDir = path.join(repoRoot, 'node_modules', '.bin');
const prismaBin = path.join(binDir, 'prisma');
const tsxBin = path.join(binDir, 'tsx');

function run(cmd: string, args: string[]) {
  console.log(`$ ${path.basename(cmd)} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    console.error(`Command failed: ${path.basename(cmd)} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

run(prismaBin, ['migrate', 'deploy']);
run(tsxBin, [path.join(repoRoot, 'prisma', 'seed-production.ts')]);
