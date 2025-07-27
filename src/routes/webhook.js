const express = require("express");
const webhookController = require("../controllers/webhookController");
const router = express.Router();

// Clean routing - your style
router.post("/webhook", webhookController.receiveWebhook);

module.exports = router;
