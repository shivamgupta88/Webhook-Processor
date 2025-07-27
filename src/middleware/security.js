const crypto = require("crypto");

// Malicious payload detection
const detectMaliciousPayload = (req, res, next) => {
  try {
    const payload = req.body;
    const payloadString = JSON.stringify(payload);

    // Check payload size
    if (payloadString.length > 1024 * 1024) {
      // 1MB limit
      return res.status(413).json({
        success: false,
        message: "Payload too large",
      });
    }

    // Check for malicious patterns
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi,
    ];

    const hasMaliciousContent = maliciousPatterns.some((pattern) =>
      pattern.test(payloadString)
    );

    if (hasMaliciousContent) {
      console.warn(`🚨 Malicious payload detected from ${req.ip}`);
      return res.status(400).json({
        success: false,
        message: "Invalid payload detected",
      });
    }

    next();
  } catch (error) {
    console.error("Security middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Security check failed",
    });
  }
};

// Enhanced signature verification
const enhancedSignatureVerification = (req, res, next) => {
  try {
    const signature =
      req.headers["x-webhook-signature"] ||
      req.headers["x-hub-signature-256"] ||
      req.headers["stripe-signature"];

    if (!signature) {
      req.isVerifiedWebhook = false;
      return next();
    }

    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      req.isVerifiedWebhook = false;
      return next();
    }

    // For different webhook providers
    let isValid = false;

    if (req.headers["x-hub-signature-256"]) {
      // GitHub style
      const expectedSignature =
        "sha256=" +
        crypto
          .createHmac("sha256", secret)
          .update(JSON.stringify(req.body))
          .digest("hex");
      isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } else if (req.headers["stripe-signature"]) {
      // Stripe style (simplified)
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      isValid = signature.includes(expectedSignature);
    } else {
      // Generic HMAC verification
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    }

    req.isVerifiedWebhook = isValid;

    if (isValid) {
      console.log(`✅ Verified webhook signature from ${req.ip}`);
    } else {
      console.warn(`⚠️  Invalid webhook signature from ${req.ip}`);
    }

    next();
  } catch (error) {
    console.error("Signature verification error:", error);
    req.isVerifiedWebhook = false;
    next();
  }
};

// Request timeout handler
const timeoutHandler = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: "Request timeout",
        });
      }
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));

    next();
  };
};

// IP whitelist for admin endpoints
const adminIPWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ADMIN_IPS
    ? process.env.ADMIN_IPS.split(",")
    : ["127.0.0.1", "::1"]; // localhost by default

  const clientIP = req.ip || req.connection.remoteAddress;

  if (!allowedIPs.includes(clientIP)) {
    console.warn(`🚨 Unauthorized admin access attempt from ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  next();
};

module.exports = {
  detectMaliciousPayload,
  enhancedSignatureVerification,
  timeoutHandler,
  adminIPWhitelist,
};
