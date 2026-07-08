import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis.js";

// Initialize a background jobs queue
export const taskQueue = new Queue("bot-tasks", {
  connection: redis as any
});

// Worker handler map
const handlers: Record<string, (data: any) => Promise<any>> = {};

export function registerJobHandler(jobName: string, handler: (data: any) => Promise<any>) {
  handlers[jobName] = handler;
}

// Start worker to process jobs
const worker = new Worker(
  "bot-tasks",
  async (job: Job) => {
    const handler = handlers[job.name];
    if (handler) {
      return await handler(job.data);
    } else {
      console.warn(`⚠️ No handler registered for job type: ${job.name}`);
    }
  },
  {
    connection: redis as any,
    concurrency: 5
  }
);

worker.on("completed", (job) => {
  console.log(`✅ Background Job ${job.id} (${job.name}) completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Background Job ${job?.id} (${job?.name}) failed:`, err);
});

export async function addBackgroundJob(name: string, data: any, delayMs?: number) {
  await taskQueue.add(name, data, {
    delay: delayMs,
    removeOnComplete: true,
    removeOnFail: false
  });
}
