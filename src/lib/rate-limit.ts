import { createClient } from 'redis';

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

let redisClientPromise: Promise<ReturnType<typeof createClient>> | undefined;
const developmentFallback = new Map<string, { count: number; resetAt: number }>();

async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  redisClientPromise ??= (async () => {
    const client = createClient({ url: redisUrl });
    client.on('error', (error) => console.error('Redis rate limiter error:', error));
    await client.connect();
    return client;
  })();

  return redisClientPromise;
}

function consumeDevelopmentFallback(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const current = developmentFallback.get(key);
  const next = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowSeconds * 1000 }
    : { ...current, count: current.count + 1 };

  developmentFallback.set(key, next);
  return {
    allowed: next.count <= limit,
    remaining: Math.max(0, limit - next.count),
    retryAfterSeconds: Math.max(1, Math.ceil((next.resetAt - now) / 1000)),
  };
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const client = await getRedisClient();

  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('REDIS_URL is required for production rate limiting');
    }
    return consumeDevelopmentFallback(key, limit, windowSeconds);
  }

  const result = await client.eval(
    `
      local count = redis.call('INCR', KEYS[1])
      if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
      local ttl = redis.call('TTL', KEYS[1])
      return { count, ttl }
    `,
    { keys: [`rate-limit:${key}`], arguments: [String(windowSeconds)] },
  ) as [number, number];

  const count = Number(result[0]);
  const ttl = Math.max(1, Number(result[1]));
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: ttl,
  };
}
