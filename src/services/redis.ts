import Redis from "ioredis";
import { config } from "../config/index.js";

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null // Required by BullMQ
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully.");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export async function setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Basic rate-limiter / cooldown checker.
 * Returns true if the action is allowed, false if ratelimited.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const current = await redis.get(key);
  const hits = current ? parseInt(current, 10) : 0;

  if (hits >= limit) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetTime: ttl > 0 ? ttl : windowSeconds
    };
  }

  const multi = redis.multi();
  multi.incr(key);
  if (hits === 0) {
    multi.expire(key, windowSeconds);
  }
  const results = await multi.exec();
  const newHits = results ? (results[0][1] as number) : 1;

  return {
    allowed: true,
    remaining: Math.max(0, limit - newHits),
    resetTime: windowSeconds
  };
}
