const mongoose = require("mongoose");

const webhookSchema = new mongoose.Schema(
  {
    // Basic Info
    webhookId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },

    // Source Info
    source: {
      type: String,
      required: true, // github, stripe, shopify etc
    },

    // Request Data
    headers: {
      type: Object,
      required: true,
    },

    payload: {
      type: Object,
      required: true,
    },

    // Processing Status
    status: {
      type: String,
      enum: ["received", "processing", "completed", "failed", "dead_letter"],
      default: "received",
    },

    // Retry Logic
    retryCount: {
      type: Number,
      default: 0,
    },

    maxRetries: {
      type: Number,
      default: 3,
    },

    // Timestamps
    receivedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: Date,

    lastRetryAt: Date,

    // Error Tracking
    errors: [
      {
        message: String,
        timestamp: { type: Date, default: Date.now },
        stack: String,
      },
    ],

    // Signature Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "webhooks",
  }
);

// Indexes for performance
webhookSchema.index({ source: 1, receivedAt: -1 });
webhookSchema.index({ status: 1 });
webhookSchema.index({ webhookId: 1 });

module.exports = mongoose.model("Webhook", webhookSchema);
