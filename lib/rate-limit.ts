import { headers } from "next/headers";

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

function checkRateLimitMemory(options: RateLimitOptions): RateLimitResult {
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

let loggedWarning = false;

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    if (!loggedWarning && process.env.NODE_ENV !== "production") {
      console.warn(
        "UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN are not set. Falling back to in-memory rate limiting."
      );
      loggedWarning = true;
    }
    return checkRateLimitMemory(options);
  }

  const key = `kothakhahon:rl:${options.key}`;
  const now = Date.now();

  try {
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["TTL", key],
      ]),
    });

    if (!response.ok) {
      throw new Error(`Upstash response code ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error("Invalid pipeline response format");
    }

    const [incrRes, ttlRes] = data;
    if (incrRes.error) throw new Error(`Redis INCR error: ${incrRes.error}`);
    if (ttlRes.error) throw new Error(`Redis TTL error: ${ttlRes.error}`);

    const count = Number(incrRes.result);
    let ttl = Number(ttlRes.result);

    if (count === 1 || ttl === -1) {
      const windowSeconds = Math.ceil(options.windowMs / 1000);
      await fetch(`${redisUrl}/expire/${key}/${windowSeconds}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
      ttl = windowSeconds;
    }

    const resetAt = now + ttl * 1000;

    if (count > options.limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterMs: Math.max(0, ttl * 1000),
        resetAt,
      };
    }

    return {
      ok: true,
      remaining: Math.max(0, options.limit - count),
      retryAfterMs: Math.max(0, ttl * 1000),
      resetAt,
    };
  } catch (error) {
    console.error("Redis rate limiting failed, falling back to in-memory:", error);
    return checkRateLimitMemory(options);
  }
}

export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() ?? "127.0.0.1";
    }
    return headerList.get("x-real-ip") ?? "127.0.0.1";
  } catch (error) {
    console.error("Failed to get client IP from headers:", error);
    return "127.0.0.1";
  }
}
