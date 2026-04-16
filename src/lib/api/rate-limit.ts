/**
 * Rate limiter with Upstash Redis for production and in-memory fallback for development.
 *
 * In production, uses @upstash/ratelimit with Redis for distributed rate limiting
 * across multiple serverless instances. In development (or when Redis is not configured),
 * falls back to an in-memory sliding window implementation.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitOptions {
  /** Maximum requests within the window. Default: read from env or 20. */
  maxRequests?: number;
  /** Window duration in milliseconds. Default: read from env or 60000 (1 min). */
  windowMs?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

function getEnvDefaults() {
  return {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxAuthenticated: parseInt(process.env.RATE_LIMIT_MAX_AUTHENTICATED || '100', 10),
    maxUnauthenticated: parseInt(process.env.RATE_LIMIT_MAX_UNAUTHENTICATED || '20', 10),
  };
}

// ============================================================
// Upstash Redis rate limiter (production)
// ============================================================

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(upstashUrl && upstashToken);

// Cache of Upstash Ratelimit instances keyed by `${maxRequests}:${windowMs}`
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const key = `${maxRequests}:${windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    const redis = new Redis({ url: upstashUrl!, token: upstashToken! });
    const windowSec = `${Math.ceil(windowMs / 1000)} s` as `${number} s`;
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, windowSec),
      prefix: 'legaidoc:rl',
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

async function upstashRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(maxRequests, windowMs);
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    resetMs: Math.max(result.reset - Date.now(), 0),
  };
}

// ============================================================
// In-memory fallback (development / when Redis is not configured)
// ============================================================

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

function memoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0] ?? now;
    const resetMs = oldestInWindow + windowMs - now;
    return {
      success: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}

// ============================================================
// Public API
// ============================================================

/**
 * Check rate limit for a given identifier.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are configured; falls back to in-memory for development.
 */
export async function rateLimit(
  identifier: string,
  opts?: RateLimitOptions,
): Promise<RateLimitResult> {
  const env = getEnvDefaults();
  const windowMs = opts?.windowMs ?? env.windowMs;
  const maxRequests = opts?.maxRequests ?? env.maxUnauthenticated;

  if (useUpstash) {
    return upstashRateLimit(identifier, maxRequests, windowMs);
  }

  return memoryRateLimit(identifier, maxRequests, windowMs);
}

export { getEnvDefaults };
export type { RateLimitOptions, RateLimitResult };
