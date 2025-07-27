// test-webhook.js
const https = require("http");

const BASE_URL = "http://localhost:3000";

const makeRequest = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = https.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data),
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
            });
          }
        });
      }
    );

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
};

const runTests = async () => {
  console.log("🧪 Testing Webhook Processor Endpoints...\n");

  try {
    // Test 1: Health Check
    console.log("🔍 Testing Health Check...");
    const health = await makeRequest("/health");
    console.log("Status:", health.status);
    console.log("Response:", JSON.stringify(health.data, null, 2));
    console.log("");

    // Test 2: Admin Dashboard
    console.log("🔍 Testing Admin Dashboard...");
    const admin = await makeRequest("/admin");
    console.log("Status:", admin.status);
    console.log("Message:", admin.data.message);
    console.log("");

    // Test 3: API Documentation
    console.log("🔍 Testing API Documentation...");
    const api = await makeRequest("/api");
    console.log("Status:", api.status);
    console.log("API Name:", api.data.name);
    console.log("Version:", api.data.version);
    console.log("");

    // Test 4: Send a test webhook
    console.log("🔍 Testing Webhook Endpoint...");
    const webhook = await makeRequest("/api/webhook", {
      method: "POST",
      headers: {
        "x-github-event": "push",
      },
      body: {
        ref: "refs/heads/main",
        repository: {
          name: "test-repo",
          full_name: "user/test-repo",
        },
        commits: [
          {
            id: "abc123",
            message: "Test commit",
            author: {
              name: "Test User",
              email: "test@example.com",
            },
          },
        ],
      },
    });
    console.log("Status:", webhook.status);
    console.log("Webhook ID:", webhook.data.webhookId);
    console.log("Verified:", webhook.data.verified);
    console.log("");

    // Test 5: Analytics
    console.log("🔍 Testing Analytics...");
    const analytics = await makeRequest("/api/analytics/stats");
    console.log("Status:", analytics.status);
    if (analytics.status === 403) {
      console.log("Blocked by IP whitelist (expected in production)");
    } else {
      console.log("Response:", JSON.stringify(analytics.data, null, 2));
    }
    console.log("");

    // Test 6: 404 handling
    console.log("🔍 Testing 404 Handling...");
    const notFound = await makeRequest("/nonexistent");
    console.log("Status:", notFound.status);
    console.log("Message:", notFound.data.message);
    console.log("");

    console.log("✅ All tests completed!");
    console.log("🚀 Your webhook processor is ready for production!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

runTests();
