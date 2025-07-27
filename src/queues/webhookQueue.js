const { Queue, Worker } = require("bullmq");
const Redis = require("ioredis");
const Webhook = require("../models/webhook");

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  //   maxRetriesPerRequest: 3,
  maxRetriesPerRequest: null,
});

// Create webhook processing queue
const webhookQueue = new Queue("webhook-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Move to dead letter function (temporary - we'll improve this)
const moveToDeadLetter = async (webhookId, reason, finalError = null) => {
  try {
    const webhook = await Webhook.findOne({ webhookId });
    if (webhook) {
      webhook.status = "dead_letter";
      webhook.errorLogs.push({
        message: `Dead Letter: ${reason}`,
        stack: finalError || "Max retries exceeded",
        timestamp: new Date(),
      });
      await webhook.save();

      console.log(`💀 Moved to dead letter: ${webhookId} - Reason: ${reason}`);
    }
  } catch (error) {
    console.error(`❌ Failed to move to dead letter: ${webhookId}`, error);
  }
};

// Webhook processor worker
const webhookWorker = new Worker(
  "webhook-processing",
  async (job) => {
    return await processWebhookJob(job);
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

// Main job processor function
const processWebhookJob = async (job) => {
  const { webhookId } = job.data;

  console.log(
    `🔄 Processing webhook: ${webhookId} (Attempt: ${job.attemptsMade + 1})`
  );

  try {
    const webhook = await Webhook.findOne({ webhookId });
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    webhook.status = "processing";
    await webhook.save();

    await processWebhookBySource(webhook);

    webhook.status = "completed";
    webhook.processedAt = new Date();
    await webhook.save();

    console.log(`✅ Webhook processed successfully: ${webhookId}`);
    return { success: true, webhookId };
  } catch (error) {
    console.error(`❌ Webhook processing failed: ${webhookId}`, error.message);

    const webhook = await Webhook.findOne({ webhookId });
    if (webhook) {
      webhook.errorLogs.push({
        message: error.message,
        stack: error.stack,
      });
      webhook.retryCount = job.attemptsMade + 1;
      webhook.lastRetryAt = new Date();

      if (job.attemptsMade + 1 >= 3) {
        webhook.status = "failed";
      }

      await webhook.save();
    }

    throw error;
  }
};

// Process webhook based on source
const processWebhookBySource = async (webhook) => {
  const { source } = webhook;

  switch (source) {
    case "github":
      await processGithubWebhook(webhook);
      break;
    case "stripe":
      await processStripeWebhook(webhook);
      break;
    case "shopify":
      await processShopifyWebhook(webhook);
      break;
    default:
      await processGenericWebhook(webhook);
  }
};

// Source-specific processors
const processGithubWebhook = async (webhook) => {
  const { payload } = webhook;
  console.log(`Processing GitHub event: ${payload.action || "unknown"}`);
  await simulateProcessing(1000);

  if (Math.random() < 0.1) {
    throw new Error("GitHub API rate limit exceeded");
  }
};

const processStripeWebhook = async (webhook) => {
  const { payload } = webhook;
  console.log(`Processing Stripe event: ${payload.type || "unknown"}`);
  await simulateProcessing(800);

  if (payload.type === "payment_intent.payment_failed") {
    throw new Error("Payment processing failed - insufficient funds");
  }
};

const processShopifyWebhook = async (webhook) => {
  const { payload } = webhook;
  console.log(`Processing Shopify event: ${payload.topic || "unknown"}`);
  await simulateProcessing(1200);
};

const processGenericWebhook = async (webhook) => {
  console.log(`Processing generic webhook from: ${webhook.source}`);
  await simulateProcessing(500);
};

const simulateProcessing = async (delay) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
};

// Worker event handlers
webhookWorker.on("completed", (job, result) => {
  console.log(`✅ Job completed: ${job.id}`);
});

webhookWorker.on("failed", async (job, error) => {
  console.log(`❌ Job failed: ${job.id} - ${error.message}`);

  if (job.attemptsMade >= 3) {
    const { webhookId } = job.data;
    await moveToDeadLetter(webhookId, "Max retries exceeded", error.message);
  }
});

webhookWorker.on("stalled", async (jobId) => {
  console.log(`⚠️  Job stalled: ${jobId}`);
});

module.exports = {
  webhookQueue,
  webhookWorker,
  redis,
  moveToDeadLetter,
};
