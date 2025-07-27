const { Queue, Worker } = require("bullmq");
const { redis } = require("./webhookQueue");
const Webhook = require("../models/webhook");

// Dead Letter Queue
const deadLetterQueue = new Queue("dead-letter-queue", {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 200, // Keep more dead letter records
    removeOnFail: 100,
  },
});

// Dead Letter Worker - handles permanently failed webhooks
const deadLetterWorker = new Worker(
  "dead-letter-queue",
  async (job) => {
    return await handleDeadLetter(job);
  },
  {
    connection: redis,
    concurrency: 2, // Lower concurrency for manual review
  }
);

// Handle dead letter webhooks
const handleDeadLetter = async (job) => {
  const { webhookId, reason, finalError } = job.data;

  console.log(`💀 Processing dead letter: ${webhookId}`);

  try {
    // Update webhook status to dead_letter
    const webhook = await Webhook.findOne({ webhookId });
    if (webhook) {
      webhook.status = "dead_letter";
      webhook.errorLogs.push({
        message: `Dead Letter: ${reason}`,
        stack: finalError || "Max retries exceeded",
        timestamp: new Date(),
      });
      await webhook.save();

      // Log for admin notification
      console.log(
        `💀 Webhook moved to dead letter: ${webhookId} - Reason: ${reason}`
      );

      // TODO: Send notification to admin/Slack
      await notifyAdmin(webhook, reason);
    }

    return { success: true, webhookId, action: "moved_to_dead_letter" };
  } catch (error) {
    console.error(`❌ Dead letter processing failed: ${webhookId}`, error);
    throw error;
  }
};

// Notify admin about dead letter webhooks
const notifyAdmin = async (webhook, reason) => {
  // Simulate admin notification
  console.log(
    `📧 ADMIN ALERT: Webhook ${webhook.webhookId} from ${webhook.source} failed permanently`
  );
  console.log(`   Reason: ${reason}`);
  console.log(
    `   Payload preview: ${JSON.stringify(webhook.payload).substring(
      0,
      100
    )}...`
  );

  // In real app: send email, Slack message, etc.
};

// Function to move webhook to dead letter
const moveToDeadLetter = async (webhookId, reason, finalError = null) => {
  try {
    await deadLetterQueue.add("handle-dead-letter", {
      webhookId,
      reason,
      finalError,
    });

    console.log(`📤 Moved to dead letter queue: ${webhookId}`);
  } catch (error) {
    console.error(`❌ Failed to move to dead letter: ${webhookId}`, error);
  }
};

// Dead letter worker events
deadLetterWorker.on("completed", (job) => {
  console.log(`💀 Dead letter handled: ${job.id}`);
});

deadLetterWorker.on("failed", (job, error) => {
  console.log(`❌ Dead letter handling failed: ${job.id} - ${error.message}`);
});

module.exports = {
  deadLetterQueue,
  deadLetterWorker,
  moveToDeadLetter,
};
