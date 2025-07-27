const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log("🚀 Starting Safe Production Server...");

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: process.env.MAX_PAYLOAD_SIZE || "1mb" }));

// Import middleware
const {
  apiLimiter,
  webhookLimiter,
  adminLimiter,
} = require("./src/middleware/rateLimiter");
const {
  detectMaliciousPayload,
  enhancedSignatureVerification,
  timeoutHandler,
  adminIPWhitelist,
} = require("./src/middleware/security");

app.use(timeoutHandler(30000));

console.log("✅ Basic middleware configured");

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Initialize Queue System
const { webhookQueue, webhookWorker } = require("./src/queues/webhookQueue");
console.log("✅ Queue System Initialized");

// Health Check
app.get("/health", async (req, res) => {
  try {
    const mongoStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    const queueWaiting = await webhookQueue.getWaiting();

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        worker: "active",
        queue: `${queueWaiting.length} waiting`,
      },
      uptime: process.uptime(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

// Admin dashboard
app.get("/admin", (req, res) => {
  res.json({
    message: "🎯 Webhook Processor Admin Dashboard",
    endpoints: {
      stats: "/api/analytics/stats",
      webhooks: "/api/analytics/webhooks",
      health: "/health",
      webhook_endpoint: "/api/webhook",
    },
    documentation: {
      webhook_format: "POST /api/webhook with JSON payload",
      supported_sources: ["github", "stripe", "shopify", "slack", "custom"],
      authentication: "HMAC-SHA256 signature in x-webhook-signature header",
      rate_limits: {
        webhooks: "100 per minute",
        analytics: "200 per 15 minutes",
        general_api: "1000 per 15 minutes",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// API Documentation
app.get("/api", (req, res) => {
  res.json({
    name: "Webhook Processor API",
    version: "1.0.0",
    description: "Reliable webhook processing with queuing and analytics",
    endpoints: {
      webhook: {
        path: "/api/webhook",
        method: "POST",
        description: "Receive and queue webhooks for processing",
      },
      analytics: {
        stats: "/api/analytics/stats",
        webhooks: "/api/analytics/webhooks",
        details: "/api/analytics/webhooks/:id",
      },
    },
    features: [
      "Automatic retry logic",
      "Dead letter queue handling",
      "Source-based prioritization",
      "Signature verification",
      "Rate limiting",
      "Real-time analytics",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to API routes
app.use("/api", apiLimiter);
console.log("✅ Rate limiting applied");

// Webhook routes with security middleware
app.use("/api/webhook", webhookLimiter);
app.use("/api/webhook", enhancedSignatureVerification);
app.use("/api/webhook", detectMaliciousPayload);

const webhookRoutes = require("./src/routes/webhook");
app.use("/api", webhookRoutes);
console.log("✅ Webhook routes mounted");

// Analytics routes with admin middleware
app.use("/api/analytics", adminLimiter);
app.use("/api/analytics", adminIPWhitelist);

const analyticsRoutes = require("./src/routes/analytics");
app.use("/api/analytics", analyticsRoutes);
console.log("✅ Analytics routes mounted");

// SAFE 404 handler - avoid wildcards
app.use((req, res, next) => {
  // Only handle unmatched routes
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    requested_path: req.path,
    method: req.method,
    available_endpoints: {
      health: "GET /health",
      admin: "GET /admin",
      api_docs: "GET /api",
      webhook: "POST /api/webhook",
      analytics_stats: "GET /api/analytics/stats",
      analytics_webhooks: "GET /api/analytics/webhooks",
    },
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("❌ Global error:", error);

  // Don't leak sensitive information in production
  const isDevelopment = process.env.NODE_ENV !== "production";

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error_id: Date.now(), // For tracking
    ...(isDevelopment && {
      error: error.message,
      stack: error.stack?.split("\n").slice(0, 5), // Limit stack trace
    }),
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("🛑 Received shutdown signal. Shutting down gracefully...");

  const shutdownTimeout = setTimeout(() => {
    console.log("❌ Graceful shutdown timeout. Forcing exit...");
    process.exit(1);
  }, 10000); // 10 second timeout

  try {
    console.log("🔄 Closing webhook worker...");
    await webhookWorker.close();

    console.log("🔄 Closing webhook queue...");
    await webhookQueue.close();

    console.log("🔄 Closing MongoDB connection...");
    await mongoose.connection.close();

    clearTimeout(shutdownTimeout);
    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// Handle various shutdown signals
process.on("SIGINT", gracefulShutdown); // Ctrl+C
process.on("SIGTERM", gracefulShutdown); // Docker/PM2 stop
process.on("SIGUSR2", gracefulShutdown); // Nodemon restart

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("🚨 This should not happen in production!");
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  console.error("🚨 Promise:", promise);
  gracefulShutdown();
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Webhook Processor Server`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
  console.log(`⚡ Webhook: http://localhost:${PORT}/api/webhook`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Server ready to process webhooks!`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("❌ Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`🚨 Port ${PORT} is already in use`);
    process.exit(1);
  }
});
