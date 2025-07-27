const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const router = express.Router();

// Dashboard stats
router.get("/stats", analyticsController.getDashboardStats);

// Recent webhooks
router.get("/webhooks", analyticsController.getRecentWebhooks);

// Webhook details
router.get("/webhooks/:webhookId", analyticsController.getWebhookDetails);

// Retry webhook
router.post("/webhooks/:webhookId/retry", analyticsController.retryWebhook);

module.exports = router;
