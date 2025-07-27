const Webhook = require("../models/webhook");

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Basic counts
    const totalWebhooks = await Webhook.countDocuments();
    const todayWebhooks = await Webhook.countDocuments({
      receivedAt: { $gte: today },
    });

    // Status counts
    const statusCounts = await Webhook.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Source counts
    const sourceCounts = await Webhook.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
          successRate: {
            $avg: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Hourly stats for last 24 hours
    const hourlyStats = await Webhook.aggregate([
      {
        $match: {
          receivedAt: { $gte: yesterday },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: "$receivedAt" },
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$receivedAt" },
            },
          },
          count: { $sum: 1 },
          successful: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.date": 1, "_id.hour": 1 } },
    ]);

    // Calculate success rate
    const completedCount =
      statusCounts.find((s) => s._id === "completed")?.count || 0;
    const successRate =
      totalWebhooks > 0
        ? ((completedCount / totalWebhooks) * 100).toFixed(1)
        : 0;

    // Response
    res.json({
      success: true,
      data: {
        overview: {
          totalWebhooks,
          todayWebhooks,
          successRate: parseFloat(successRate),
        },
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        sourceBreakdown: sourceCounts,
        hourlyStats,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

// Get recent webhooks
exports.getRecentWebhooks = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, source } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;

    // Fetch with pagination
    const webhooks = await Webhook.find(filter)
      .sort({ receivedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select(
        "webhookId source status receivedAt processedAt retryCount errors"
      );

    const total = await Webhook.countDocuments(filter);

    res.json({
      success: true,
      data: {
        webhooks,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: webhooks.length,
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    console.error("Recent webhooks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent webhooks",
    });
  }
};

// Get webhook details
exports.getWebhookDetails = async (req, res) => {
  try {
    const { webhookId } = req.params;

    const webhook = await Webhook.findOne({ webhookId });
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: "Webhook not found",
      });
    }

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    console.error("Webhook details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch webhook details",
    });
  }
};

// Retry failed webhook
exports.retryWebhook = async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { webhookQueue } = require("../queues/webhookQueue");

    const webhook = await Webhook.findOne({ webhookId });
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: "Webhook not found",
      });
    }

    if (webhook.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Webhook already completed",
      });
    }

    // Reset status and add to queue
    webhook.status = "received";
    webhook.retryCount = 0;
    await webhook.save();

    // Add to queue for retry
    await webhookQueue.add(
      "process-webhook",
      {
        webhookId: webhook.webhookId,
      },
      {
        priority: 1, // High priority for manual retries
      }
    );

    res.json({
      success: true,
      message: "Webhook queued for retry",
      webhookId,
    });
  } catch (error) {
    console.error("Retry webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retry webhook",
    });
  }
};
