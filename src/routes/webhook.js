const express = require("express");
const webhookController = require("../controllers/webhookController");
const router = express.Router();

// Main webhook endpoint
router.post(
  "/webhook",
  webhookController.receiveWebhook.bind(webhookController)
);

// Source-specific endpoints (optional)
router.post(
  "/webhook/github",
  (req, res, next) => {
    req.query.source = "github";
    next();
  },
  webhookController.receiveWebhook.bind(webhookController)
);

router.post(
  "/webhook/stripe",
  (req, res, next) => {
    req.query.source = "stripe";
    next();
  },
  webhookController.receiveWebhook.bind(webhookController)
);

module.exports = router;
