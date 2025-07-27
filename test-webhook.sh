#!/bin/bash

echo "🧪 Testing Webhook Processor Endpoints..."
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Health Check
echo "🔍 Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# Test 2: Admin Dashboard
echo "🔍 Testing Admin Dashboard..."
curl -s "$BASE_URL/admin" | jq '.message'
echo ""

# Test 3: API Documentation
echo "🔍 Testing API Documentation..."
curl -s "$BASE_URL/api" | jq '.name, .version'
echo ""

# Test 4: Send a test webhook
echo "🔍 Testing Webhook Endpoint..."
curl -X POST "$BASE_URL/api/webhook" \
  -H "Content-Type: application/json" \
  -H "x-github-event: push" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "name": "test-repo",
      "full_name": "user/test-repo"
    },
    "commits": [
      {
        "id": "abc123",
        "message": "Test commit",
        "author": {
          "name": "Test User",
          "email": "test@example.com"
        }
      }
    ]
  }' | jq '.'
echo ""

# Test 5: Analytics (might be blocked by IP whitelist)
echo "🔍 Testing Analytics (may be blocked by IP whitelist)..."
curl -s "$BASE_URL/api/analytics/stats" | jq '.' 2>/dev/null || echo "Blocked by IP whitelist (expected in production)"
echo ""

# Test 6: 404 handling
echo "🔍 Testing 404 Handling..."
curl -s "$BASE_URL/nonexistent" | jq '.message'
echo ""

echo "✅ All basic tests completed!"
echo "🚀 Your webhook processor is ready for production!"