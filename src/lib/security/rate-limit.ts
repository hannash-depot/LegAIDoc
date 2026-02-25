import { NextResponse } from "next/server";
import crypto from "crypto";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

declare global {
  // eslint-disable-next-line no-var
  var __legaidocRateLimitStore: RateLimitStore | undefined;
  // eslint-disable-next-line no-var
  var __legaidocRateLimitLastCleanup: number | undefined;
}

const store: RateLimitStore =
  globalThis.__legaidocRateLimitStore ?? new Map<string, RateLimitBucket>();
globalThis.__legaidocRateLimitStore = store;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export interface RateLimitInput {
  key: string;
  limit: number;
  windowMs: number;
}

function cleanupExpiredBuckets(now: number) {
  const lastCleanup = globalThis.__legaidocRateLimitLastCleanup ?? 0;
  if (now - lastCleanup < 60_000) {
    return;
  }

  for (const [bucketKey, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(bucketKey);
    }
  }

  globalThis.__legaidocRateLimitLastCleanup = now;
}

export function consumeRateLimit(input: RateLimitInput): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const existing = store.get(input.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + input.windowMs;
    store.set(input.key, { count: 1, resetAt });
    return {
      success: true,
      limit: input.limit,
      remaining: Math.max(input.limit - 1, 0),
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  const nextCount = existing.count + 1;
  const success = nextCount <= input.limit;

  store.set(input.key, {
    count: nextCount,
    resetAt: existing.resetAt,
  });

  const retryAfterSeconds = success
    ? 0
    : Math.max(Math.ceil((existing.resetAt - now) / 1000), 1);

  return {
    success,
    limit: input.limit,
    remaining: Math.max(input.limit - nextCount, 0),
    resetAt: existing.resetAt,
    retryAfterSeconds,
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const resetEpochSeconds = Math.floor(result.resetAt / 1000).toString();
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": resetEpochSeconds,
  };

  if (!result.success && result.retryAfterSeconds > 0) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export function rateLimitExceededResponse(
  result: RateLimitResult,
  message = "Too many requests. Please try again later."
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: buildRateLimitHeaders(result),
    }
  );
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  return "unknown";
}

export function hashIdentifier(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
