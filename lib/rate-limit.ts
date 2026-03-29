type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
  resetAt: number;
};

declare global {
  var __kothakhahonRateLimitStore: Map<string, Bucket> | undefined;
}

const store = globalThis.__kothakhahonRateLimitStore ?? new Map<string, Bucket>();
globalThis.__kothakhahonRateLimitStore = store;

function cleanupExpired(now: number) {
  if (store.size < 1024) return;

  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const existing = store.get(options.key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(options.key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterMs: options.windowMs,
      resetAt,
    };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.resetAt - now),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  store.set(options.key, existing);

  return {
    ok: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterMs: Math.max(0, existing.resetAt - now),
    resetAt: existing.resetAt,
  };
}
