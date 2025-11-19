import Redis from 'ioredis';

// Upstash Redis configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isUpstash = redisUrl.includes('upstash.io');

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Enable TLS for Upstash, disable for local Redis
  tls: isUpstash ? {
    rejectUnauthorized: false
  } : undefined,
  // Connection timeout
  connectTimeout: 10000,
  // Keep alive
  keepAlive: 30000,
});

redis.on('connect', () => {
  console.log(`✅ Connected to Redis${isUpstash ? ' (Upstash)' : ' (Local)'}`);
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

export default redis;
