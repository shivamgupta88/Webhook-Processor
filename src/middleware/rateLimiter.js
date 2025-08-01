const rateLimit = require("express-rate-limit");

console.log("🔍 Initializing rate limiters...");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // FIXED: Remove any custom key generators that might cause issues
});

console.log("✅ API limiter created");

// Webhook specific rate limiter - SIMPLIFIED
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 webhooks per minute per IP
  message: {
    success: false,
    message: "Webhook rate limit exceeded. Max 100 webhooks per minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // FIXED: Simplified skip function
  skip: (req) => {
    // Skip rate limiting for verified webhooks from trusted sources
    return req.isVerifiedWebhook === true;
  },
});

console.log("✅ Webhook limiter created");

// Admin endpoints rate limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Lower limit for admin endpoints
  message: {
    success: false,
    message: "Admin API rate limit exceeded.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

console.log("✅ Admin limiter created");

// Test that all limiters are functions
console.log("🔍 Rate limiter types:");
console.log("  apiLimiter:", typeof apiLimiter);
console.log("  webhookLimiter:", typeof webhookLimiter);
console.log("  adminLimiter:", typeof adminLimiter);

// Validate they're middleware functions
if (typeof apiLimiter !== "function") {
  throw new Error("apiLimiter is not a function");
}
if (typeof webhookLimiter !== "function") {
  throw new Error("webhookLimiter is not a function");
}
if (typeof adminLimiter !== "function") {
  throw new Error("adminLimiter is not a function");
}

console.log("✅ All rate limiters are valid middleware functions");

module.exports = {
  apiLimiter,
  webhookLimiter,
  adminLimiter,
};
