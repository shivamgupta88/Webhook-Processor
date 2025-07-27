const Webhook = require("../models/webhook");
const crypto = require("crypto");
const { webhookQueue } = require("../queues/webhookQueue");
const sourceManager = require("../utils/sourceManager");

// Main webhook receiver with security
exports.receiveWebhook = async (req, res) => {
  try {
    const { headers, body } = req;

    // Extract source
    const source = extractSource(headers, req);

    // Check if source is disabled
    if (sourceManager.isSourceDisabled(source)) {
      console.warn(`🚫 Webhook rejected - source disabled: ${source}`);
      return res.status(423).json({
        success: false,
        message: "Webhook source temporarily disabled due to high failure rate",
      });
    }

    // Enhanced verification from middleware
    const isVerified = req.isVerifiedWebhook || false;

    // Create webhook record
    const webhook = new Webhook({
      source,
      headers: sanitizeHeaders(headers),
      payload: body,
      isVerified,
      status: "received",
    });

    await webhook.save();

    console.log(
      `✅ Webhook received: ${webhook.webhookId} from ${source} (Verified: ${isVerified})`
    );

    // Quick response
    res.status(200).json({
      success: true,
      webhookId: webhook.webhookId,
      message: "Webhook received successfully",
      verified: isVerified,
    });

    // Check source health periodically
    sourceManager.checkSourceHealth(source);

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

// Rest of the functions remain same...
const processWebhookAsync = async (webhook) => {
  try {
    await webhookQueue.add(
      "process-webhook",
      {
        webhookId: webhook.webhookId,
      },
      {
        priority: getWebhookPriority(webhook.source),
        delay: 0,
      }
    );

    console.log(`📤 Queued webhook: ${webhook.webhookId}`);
  } catch (error) {
    console.error(`❌ Queue error: ${webhook.webhookId}`, error);

    webhook.status = "failed";
    webhook.errorLogs.push({
      message: `Queue error: ${error.message}`,
      stack: error.stack,
    });
    await webhook.save();
  }
};

const getWebhookPriority = (source) => {
  const priorities = {
    stripe: 1,
    shopify: 1,
    github: 2,
    slack: 3,
    unknown: 5,
  };

  return priorities[source] || 5;
};

const extractSource = (headers, req) => {
  if (headers["x-github-event"]) return "github";
  if (headers["stripe-signature"]) return "stripe";
  if (headers["x-shopify-topic"]) return "shopify";
  if (headers["user-agent"]?.includes("Slack")) return "slack";

  return req.query.source || headers["x-webhook-source"] || "unknown";
};

const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized["x-api-key"];
  delete sanitized["x-auth-token"];
  return sanitized;
};
