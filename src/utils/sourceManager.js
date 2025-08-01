const Webhook = require("../models/webhook");

class SourceManager {
  constructor() {
    this.disabledSources = new Set();
    this.sourceStats = new Map();
  }

  // Check if source should be auto-disabled
  async checkSourceHealth(source) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get recent webhook stats for this source
      const recentWebhooks = await Webhook.find({
        source,
        receivedAt: { $gte: oneHourAgo },
      });

      if (recentWebhooks.length === 0) return true;

      // Calculate failure rate
      const failedCount = recentWebhooks.filter(
        (w) => w.status === "failed" || w.status === "dead_letter"
      ).length;

      const failureRate = failedCount / recentWebhooks.length;

      // Auto-disable if failure rate > 80% and minimum 10 webhooks
      if (failureRate > 0.8 && recentWebhooks.length >= 10) {
        this.disableSource(
          source,
          `High failure rate: ${(failureRate * 100).toFixed(1)}%`
        );
        return false;
      }

      // Auto-enable if source was disabled but now healthy
      if (this.disabledSources.has(source) && failureRate < 0.2) {
        this.enableSource(source);
      }

      return !this.disabledSources.has(source);
    } catch (error) {
      console.error(`Error checking source health for ${source}:`, error);
      return true; // Default to allowing if check fails
    }
  }

  // Disable source
  disableSource(source, reason) {
    this.disabledSources.add(source);
    console.warn(`🚫 Auto-disabled source: ${source} - Reason: ${reason}`);

    // Log to database for admin review
    this.logSourceEvent(source, "disabled", reason);
  }

  // Enable source
  enableSource(source) {
    this.disabledSources.delete(source);
    console.log(`✅ Auto-enabled source: ${source}`);

    this.logSourceEvent(source, "enabled", "Failure rate improved");
  }

  // Check if source is disabled
  isSourceDisabled(source) {
    return this.disabledSources.has(source);
  }

  // Log source events (simplified - could store in separate collection)
  async logSourceEvent(source, action, reason) {
    try {
      console.log(`📝 Source Event: ${source} - ${action} - ${reason}`);
      // In production: store in dedicated SourceEvent collection
    } catch (error) {
      console.error("Error logging source event:", error);
    }
  }

  // Get disabled sources list
  getDisabledSources() {
    return Array.from(this.disabledSources);
  }

  // Manual disable/enable for admin
  manualDisableSource(source, reason = "Manual disable") {
    this.disableSource(source, reason);
  }

  manualEnableSource(source) {
    this.enableSource(source);
  }
}

// Singleton instance
const sourceManager = new SourceManager();

module.exports = sourceManager;
