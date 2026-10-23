import 'dotenv/config';
const n = (k: string, d: number) => Number(process.env[k] ?? d);
export const env = {
  port: n('PORT', 4000),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  concurrency: n('WORKER_CONCURRENCY', 5),
  minDelayMs: n('MIN_DELAY_MS', 2000),
  maxPerHour: n('MAX_EMAILS_PER_HOUR_PER_SENDER', 100),
};
