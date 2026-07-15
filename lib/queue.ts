import { Queue } from 'bullmq';
import IORedis from 'ioredis';

let webhookQueue: Queue<WebhookJobData> | null = null;

export function getWebhookQueue() {
  if (!webhookQueue) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl && process.env.NODE_ENV === "production") {
      throw new Error("REDIS_URL is required in production");
    }

    const connection = new IORedis(redisUrl || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    webhookQueue = new Queue<WebhookJobData>('webhook-events', { connection });
  }

  return webhookQueue;
}

export type WebhookJobData = {
  messageId: string;
  phone: string;
  text: string;
  name?: string;
  organizationId?: string;
  businessNumber?: string;
  phoneNumberId?: string;
};
