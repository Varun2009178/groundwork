import { Redis } from "@upstash/redis";

const DAILY_LIMIT = 10;
const TTL_SECONDS = 86400; // 24 hours

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // If KV is not configured (local dev), fail open
  if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }

  const redis = Redis.fromEnv();
  const key = `ratelimit:parse:${ip}`;

  try {
    // Atomic: single incr avoids race condition between get and incr
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, TTL_SECONDS);
    }

    if (count > DAILY_LIMIT) {
      return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
    }

    return { allowed: true, remaining: DAILY_LIMIT - count, limit: DAILY_LIMIT };
  } catch (error) {
    // Fail open: if KV is down, allow the request
    console.error("Rate limit check failed, allowing request:", error);
    return { allowed: true, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }
}
