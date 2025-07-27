const Webhook = require("../models/webhook");
const crypto = require("crypto");

class WebhookController {
  // Main webhook receiver
  async receiveWebhook(req, res) {
    try {
      const { headers, body } = req;

      // Extract source from headers or URL
      const source = this.extractSource(headers, req);

      // Verify signature (basic implementation)
      const isVerified = this.verifySignature(headers, body);

      // Create webhook record
      const webhook = new Webhook({
        source,
        headers: this.sanitizeHeaders(headers),
        payload: body,
        isVerified,
        status: "received",
      });

      await webhook.save();

      console.log(`✅ Webhook received: ${webhook.webhookId} from ${source}`);

      // Quick response (don't make sender wait)
      res.status(200).json({
        success: true,
        webhookId: webhook.webhookId,
        message: "Webhook received successfully",
      });

      // Process asynchronously (we'll add queue later)
      this.processWebhookAsync(webhook);
    } catch (error) {
      console.error("❌ Webhook receive error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Extract source from request
  extractSource(headers, req) {
    // Common webhook sources
    if (headers["x-github-event"]) return "github";
    if (headers["stripe-signature"]) return "stripe";
    if (headers["x-shopify-topic"]) return "shopify";
    if (headers["user-agent"]?.includes("Slack")) return "slack";

    // Fallback to query param or default
    return req.query.source || "unknown";
  }

  // Basic signature verification
  verifySignature(headers, body) {
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
  }

  // Remove sensitive headers
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized["x-api-key"];
    return sanitized;
  }

  // Async processing (placeholder)
  async processWebhookAsync(webhook) {
    try {
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      webhook.status = "completed";
      webhook.processedAt = new Date();
      await webhook.save();

      console.log(`✅ Processed: ${webhook.webhookId}`);
    } catch (error) {
      console.error(`❌ Processing failed: ${webhook.webhookId}`, error);
      webhook.status = "failed";
      webhook.errors.push({
        message: error.message,
        stack: error.stack,
      });
      await webhook.save();
    }
  }
}

module.exports = new WebhookController();
