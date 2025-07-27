const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Initialize Queue System (ONLY webhookQueue for now)
const { webhookQueue, webhookWorker } = require("./src/queues/webhookQueue");
console.log("✅ Queue System Initialized");

// Routes
const webhookRoutes = require("./src/routes/webhook");
const analyticsRoutes = require("./src/routes/analytics");

app.use("/api", webhookRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    queue: "Ready",
  });
});

// Admin dashboard route
app.get("/admin", (req, res) => {
  res.json({
    message: "Webhook Processor Admin Dashboard",
    endpoints: {
      stats: "/api/analytics/stats",
      webhooks: "/api/analytics/webhooks",
      health: "/health",
    },
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down gracefully...");
  await webhookWorker.close();
  await webhookQueue.close();
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/admin`);
});
