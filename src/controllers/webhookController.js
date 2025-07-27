const Webhook = require("../models/webhook");
const crypto = require("crypto");
const { webhookQueue } = require("../queues/webhookQueue"); // Add this line

// Main webhook receiver
exports.receiveWebhook = async (req, res) => {
  try {
    const { headers, body } = req;

    // Extract source from headers or URL
    const source = extractSource(headers, req);

    // Verify signature
    const isVerified = verifySignature(headers, body);

    // Create webhook record
    const webhook = new Webhook({
      source,
      headers: sanitizeHeaders(headers),
      payload: body,
      isVerified,
      status: "received",
    });

    await webhook.save();

    console.log(`✅ Webhook received: ${webhook.webhookId} from ${source}`);

    // Quick response - don't make sender wait!
    res.status(200).json({
      success: true,
      webhookId: webhook.webhookId,
      message: "Webhook received successfully",
    });

    // Add to queue for processing
    await processWebhookAsync(webhook);
  } catch (error) {
    console.error("❌ Webhook receive error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Updated async processing - now uses queue!
const processWebhookAsync = async (webhook) => {
  try {
    // Add to queue with priority
    await webhookQueue.add(
      "process-webhook",
      {
        webhookId: webhook.webhookId,
      },
      {
        priority: getWebhookPriority(webhook.source),
        delay: 0, // Process immediately
      }
    );

    console.log(`📤 Queued webhook: ${webhook.webhookId}`);
  } catch (error) {
    console.error(`❌ Queue error: ${webhook.webhookId}`, error);

    webhook.status = "failed";
    webhook.errors.push({
      message: `Queue error: ${error.message}`,
      stack: error.stack,
    });
    await webhook.save();
  }
};

// Priority system
const getWebhookPriority = (source) => {
  const priorities = {
    stripe: 1, // High priority (payments)
    shopify: 1, // High priority (orders)
    github: 2, // Medium priority
    slack: 3, // Low priority
    unknown: 5, // Lowest priority
  };

  return priorities[source] || 5;
};

// Helper functions remain same
const extractSource = (headers, req) => {
  if (headers["x-github-event"]) return "github";
  if (headers["stripe-signature"]) return "stripe";
  if (headers["x-shopify-topic"]) return "shopify";
  if (headers["user-agent"]?.includes("Slack")) return "slack";

  return req.query.source || "unknown";
};

const verifySignature = (headers, body) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false;

  const signature =
    headers["x-webhook-signature"] || headers["x-hub-signature-256"];
  if (!signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(body))
      .digest("hex");

    return signature.includes(expectedSignature);
  } catch (error) {
    return false;
  }
};

const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized["x-api-key"];
  return sanitized;
};
