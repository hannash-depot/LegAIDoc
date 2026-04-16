import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

/**
 * Disk-backed cache for LLM parse results.
 *
 * The dev server restarts frequently, so a module-scoped Map loses all hits.
 * This persists entries to `.cache/ai-parse.json` under the project root so
 * identical uploads skip the 30+ second LLM round-trip across restarts.
 */

export interface CachedEntry {
  definition: unknown;
  usage: { inputTokens: number; outputTokens: number };
}

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'ai-parse.json');
const MAX_ENTRIES = 100;

let cache: Map<string, CachedEntry> | null = null;

function load(): Map<string, CachedEntry> {
  if (cache) return cache;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')) as Record<string, CachedEntry>;
      cache = new Map(Object.entries(data));
    } else {
      cache = new Map();
    }
  } catch (err) {
    logger.warn('Failed to load parse cache, starting fresh', { err: String(err) });
    cache = new Map();
  }
  return cache;
}

function persist(): void {
  const c = load();
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(c)), 'utf-8');
  } catch (err) {
    logger.warn('Failed to persist parse cache', { err: String(err) });
  }
}

export function hashContent(text: string, provider: string): string {
  return crypto.createHash('sha256').update(`${provider}:${text}`).digest('hex');
}

export function getCached(key: string): CachedEntry | undefined {
  return load().get(key);
}

export function setCached(key: string, entry: CachedEntry): void {
  const c = load();
  c.set(key, entry);
  // FIFO eviction by insertion order
  while (c.size > MAX_ENTRIES) {
    const firstKey = c.keys().next().value;
    if (firstKey === undefined) break;
    c.delete(firstKey);
  }
  persist();
}

export function clearParseCache(): void {
  cache = new Map();
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch {
    // ignore
  }
}
