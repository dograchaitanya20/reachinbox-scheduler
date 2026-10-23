import { Queue } from 'bullmq';
import { redis } from './redis';
export const QUEUE = 'emails';
export const queue = new Queue(QUEUE, { connection: redis });
