// src/components/WebhookProcessor.jsx
import React, { useState, useEffect } from "react";
import {
  Zap,
  Copy,
  Check,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  ArrowLeft,
  Play,
} from "lucide-react";

// API configuration
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://your-backend-url.com";

function WebhookProcessor({ onNavigate }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [userKey, setUserKey] = useState("");
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    successful: 0,
    failed: 0,
  });

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = () => {
    let key = localStorage.getItem("webhook_user_key");
    if (!key) {
      key = "user_" + Math.random().toString(36).substr(2, 12);
      localStorage.setItem("webhook_user_key", key);
    }
    setUserKey(key);
    setWebhookUrl(`${API_BASE_URL}/webhook/${key}`);
    loadWebhooks(key);
  };

  const loadWebhooks = async (key) => {
    if (!key) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/webhooks/${key}`);
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.data.webhooks || []);
        setStats(
          data.data.stats || { total: 0, today: 0, successful: 0, failed: 0 }
        );
      }
    } catch (error) {
      console.error("Failed to load webhooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteWebhook = async (webhookId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/webhooks/${userKey}/${webhookId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        loadWebhooks(userKey);
      }
    } catch (error) {
      console.error("Failed to delete webhook:", error);
    }
  };

  const sendTestWebhook = async () => {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: true,
          message: "Test webhook from dashboard",
          timestamp: new Date().toISOString(),
          data: { user: "dashboard-user", action: "test" },
        }),
      });
      if (response.ok) {
        setTimeout(() => loadWebhooks(userKey), 1000);
      }
    } catch (error) {
      console.error("Failed to send test webhook:", error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceColor = (source) => {
    const colors = {
      GitHub: "bg-gray-100 text-gray-800",
      Stripe: "bg-purple-100 text-purple-800",
      Shopify: "bg-green-100 text-green-800",
      Slack: "bg-blue-100 text-blue-800",
      Custom: "bg-orange-100 text-orange-800",
    };
    return colors[source] || "bg-gray-100 text-gray-800";
  };

  const statsConfig = [
    { label: "Total", value: stats.total, color: "text-gray-900" },
    { label: "Today", value: stats.today, color: "text-blue-600" },
    { label: "Successful", value: stats.successful, color: "text-green-600" },
    { label: "Failed", value: stats.failed, color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate("landing")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">WebhookStream</span>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Demo
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Demo Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="bg-red-500 rounded-full p-1 mr-3 mt-0.5">
              <Play className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Live Demo Environment
              </h3>
              <p className="text-sm text-red-700 mt-1">
                This is a fully functional webhook processor. Send real webhooks
                to test the system!
              </p>
            </div>
          </div>
        </div>

        {/* Webhook URL Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Webhook Endpoint
          </h3>
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-50 rounded-md p-3 font-mono text-sm border">
              {webhookUrl}
            </div>
            <button
              onClick={copyWebhookUrl}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={sendTestWebhook}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              <Zap className="h-4 w-4" />
              <span>Test</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Send POST requests to this URL with JSON payload. All data is
            temporarily stored and auto-deleted after 7 days.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {statsConfig.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 text-center"
            >
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Webhooks List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Webhooks
              </h3>
              <button
                onClick={() => loadWebhooks(userKey)}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:border-gray-400 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader className="mx-auto h-8 w-8 text-red-500 animate-spin mb-4" />
              <p className="text-gray-600">Loading webhooks...</p>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No webhooks yet
              </h3>
              <p className="text-gray-600 mb-6">
                Send a POST request to your webhook URL to get started
              </p>
              <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-4 border">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Test with curl:
                </p>
                <code className="text-sm text-gray-600 break-all block">
                  {`curl -X POST ${webhookUrl} -H "Content-Type: application/json" -d '{"test": "data"}'`}
                </code>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.webhookId}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(webhook.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {webhook.webhookId}
                          </span>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(
                              webhook.source
                            )}`}
                          >
                            {webhook.source}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatTime(webhook.receivedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteWebhook(webhook.webhookId)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-50 rounded-md p-3 border">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Payload:
                    </p>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(webhook.payload, null, 2).substring(
                        0,
                        200
                      )}
                      {JSON.stringify(webhook.payload).length > 200 && "..."}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WebhookProcessor;
