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
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
  },
});

// Webhook processor worker - your style!
const webhookWorker = new Worker(
  "webhook-processing",
  async (job) => {
    return await processWebhookJob(job);
  },
  {
    connection: redis,
    concurrency: 5, // Process 5 webhooks simultaneously
  }
);

// Main job processor function
const processWebhookJob = async (job) => {
  const { webhookId } = job.data;

  console.log(
    `🔄 Processing webhook: ${webhookId} (Attempt: ${job.attemptsMade + 1})`
  );

  try {
    // Get webhook from database
    const webhook = await Webhook.findOne({ webhookId });
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    // Update status to processing
    webhook.status = "processing";
    await webhook.save();

    // Process webhook by source
    await processWebhookBySource(webhook);

    // Mark as completed
    webhook.status = "completed";
    webhook.processedAt = new Date();
    await webhook.save();

    console.log(`✅ Webhook processed successfully: ${webhookId}`);
    return { success: true, webhookId };
  } catch (error) {
    console.error(`❌ Webhook processing failed: ${webhookId}`, error.message);

    // Update webhook with error
    const webhook = await Webhook.findOne({ webhookId });
    if (webhook) {
      webhook.errors.push({
        message: error.message,
        stack: error.stack,
      });
      webhook.retryCount = job.attemptsMade + 1;
      webhook.lastRetryAt = new Date();

      // If max attempts reached, move to failed
      if (job.attemptsMade + 1 >= 3) {
        webhook.status = "failed";
      }

      await webhook.save();
    }

    throw error; // Re-throw for BullMQ retry logic
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

  // Simulate GitHub webhook processing
  // Real logic: create issue, update PR status, deploy code, etc.
  await simulateProcessing(1000);

  // Simulate potential failure for demo
  if (Math.random() < 0.1) {
    // 10% chance of failure
    throw new Error("GitHub API rate limit exceeded");
  }
};

const processStripeWebhook = async (webhook) => {
  const { payload } = webhook;

  console.log(`Processing Stripe event: ${payload.type || "unknown"}`);

  // Real logic: update payment status, send confirmation email
  await simulateProcessing(800);

  // Simulate payment processing delay
  if (payload.type === "payment_intent.payment_failed") {
    throw new Error("Payment processing failed - insufficient funds");
  }
};

const processShopifyWebhook = async (webhook) => {
  const { payload } = webhook;

  console.log(`Processing Shopify event: ${payload.topic || "unknown"}`);

  // Real logic: update inventory, process order, send notifications
  await simulateProcessing(1200);
};

const processGenericWebhook = async (webhook) => {
  console.log(`Processing generic webhook from: ${webhook.source}`);

  // Generic processing logic
  await simulateProcessing(500);
};

// Simulate processing time
const simulateProcessing = async (delay) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
};

// Worker event handlers
webhookWorker.on("completed", (job, result) => {
  console.log(`✅ Job completed: ${job.id}`);
});

webhookWorker.on("failed", (job, error) => {
  console.log(`❌ Job failed: ${job.id} - ${error.message}`);
});

webhookWorker.on("stalled", (jobId) => {
  console.log(`⚠️  Job stalled: ${jobId}`);
});

// Export functions
module.exports = {
  webhookQueue,
  webhookWorker,
  redis,
};
