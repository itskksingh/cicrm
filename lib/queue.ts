import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const webhookQueue = new Queue('webhook-events', { connection });

export type WebhookJobData = {
  messageId: string;
  phone: string;
  text: string;
  name?: string;
  organizationId?: string;
  businessNumber?: string;
};
