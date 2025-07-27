/**
 * k6 Load Testing Script for African Property Trust API
 *
 * Tests the /api/properties endpoint at 50 RPS as specified in sprint actions
 *
 * Usage:
 *   k6 run scripts/load-test.js
 *   k6 run --vus 10 --duration 30s scripts/load-test.js
 *   k6 run --env LOG_LEVEL=DEBUG scripts/load-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { Logger } from "./logger.js";

// Custom metrics
const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");
const cacheHitRate = new Rate("cache_hits");

// Test configuration
export const options = {
  // Scenario 1: Baseline load test - 50 RPS for 2 minutes
  scenarios: {
    baseline_load: {
      executor: "constant-arrival-rate",
      rate: 50, // 50 requests per second
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 10,
      maxVUs: 50,
    },

    // Scenario 2: Spike test - sudden increase to 100 RPS
    spike_test: {
      executor: "ramping-arrival-rate",
      startRate: 50,
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: 100,
      stages: [
        { duration: "30s", target: 50 }, // Normal load
        { duration: "10s", target: 100 }, // Spike
        { duration: "30s", target: 100 }, // Sustained spike
        { duration: "10s", target: 50 }, // Recovery
      ],
      startTime: "2m30s", // Start after baseline test
    },

    // Scenario 3: Stress test - gradually increase load
    stress_test: {
      executor: "ramping-arrival-rate",
      startRate: 50,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: 200,
      stages: [
        { duration: "1m", target: 100 },
        { duration: "1m", target: 150 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 50 },
      ],
      startTime: "5m", // Start after spike test
    },
  },

  // Thresholds for pass/fail criteria
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.05"], // Error rate under 5%
    errors: ["rate<0.05"], // Custom error rate under 5%
    cache_hits: ["rate>0.3"], // Cache hit rate above 30%
  },
};

// Base URL configuration with proper environment variable handling
const BASE_URL = (typeof __ENV !== 'undefined' && __ENV.BASE_URL) || "http://localhost:5000";

// Test data for different scenarios
const searchParams = [
  "", // No parameters
  "?limit=10",
  "?limit=20&page=1",
  "?location=Nairobi",
  "?location=Mombasa",
  "?propertyType=apartment",
  "?propertyType=house",
  "?minPrice=1000000&maxPrice=5000000",
  "?bedrooms=2",
  "?bedrooms=3&bathrooms=2",
  "?sortBy=price&sortOrder=asc",
  "?sortBy=createdAt&sortOrder=desc",
];

// Note: Endpoint testing is handled dynamically through the weighted selection system

// Authentication tokens for testing authenticated endpoints
const authTokens = [
  // Add test tokens here if needed
  // 'Bearer test-token-1',
  // 'Bearer test-token-2',
];

export default function () {
  // Randomly select which type of endpoint to test (weighted towards properties)
  const endpointWeights = [
    { endpoint: "/api/properties", weight: 40 },
    { endpoint: "/api/transactions", weight: 20 },
    { endpoint: "/api/statistics", weight: 15 },
    { endpoint: "/api/fraud/detection", weight: 10 },
    { endpoint: "/api/trust/score", weight: 10 },
    { endpoint: "/api/users/profile", weight: 5 },
  ];

  const totalWeight = endpointWeights.reduce(
    (sum, item) => sum + item.weight,
    0
  );
  const random = Math.random() * totalWeight;
  let currentWeight = 0;
  let selectedEndpoint = "/api/properties";

  for (const item of endpointWeights) {
    currentWeight += item.weight;
    if (random <= currentWeight) {
      selectedEndpoint = item.endpoint;
      break;
    }
  }

  // Build URL based on selected endpoint
  let url;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "k6-load-test/1.0",
  };

  switch (selectedEndpoint) {
    case "/api/properties": {
      const params =
        searchParams[Math.floor(Math.random() * searchParams.length)];
      url = `${BASE_URL}/api/properties${params}`;
      break;
    }

    case "/api/transactions": {
      const transactionParams = [
        "",
        "?limit=10",
        "?status=completed",
        "?status=pending",
        "?type=buy",
        "?type=sell",
        "?suspicious=true",
        "?suspicious=false",
        "?sortBy=amount&sortOrder=desc",
        "?sortBy=transactionDate&sortOrder=desc",
      ];
      const txParam =
        transactionParams[Math.floor(Math.random() * transactionParams.length)];
      url = `${BASE_URL}/api/transactions${txParam}`;
      break;
    }

    case "/api/statistics": {
      const statsParams = [
        "",
        "?type=property_count",
        "?type=user_count",
        "?type=transaction_count",
        "?type=engagement",
        "?period=monthly",
        "?period=yearly",
        "?key=by_city",
        "?key=by_type",
      ];
      const statsParam =
        statsParams[Math.floor(Math.random() * statsParams.length)];
      url = `${BASE_URL}/api/statistics${statsParam}`;
      break;
    }

    case "/api/fraud/detection": {
      const fraudParams = [
        "",
        "?type=properties",
        "?type=transactions",
        "?type=users",
        "?threshold=high",
        "?threshold=medium",
      ];
      const fraudParam =
        fraudParams[Math.floor(Math.random() * fraudParams.length)];
      url = `${BASE_URL}/api/fraud/detection${fraudParam}`;
      break;
    }

    case "/api/trust/score": {
      const trustParams = ["", "?userId=1", "?userId=2", "?calculate=true"];
      const trustParam =
        trustParams[Math.floor(Math.random() * trustParams.length)];
      url = `${BASE_URL}/api/trust/score${trustParam}`;
      break;
    }

    default: {
      url = `${BASE_URL}${selectedEndpoint}`;
      break;
    }
  }

  // Add authentication if available
  if (authTokens.length > 0) {
    headers["Authorization"] =
      authTokens[Math.floor(Math.random() * authTokens.length)];
  }

  // Make the request
  const startTime = Date.now();
  const response = http.get(url, { headers });
  const endTime = Date.now();

  // Record custom metrics
  responseTime.add(endTime - startTime);

  // Check if request was successful based on endpoint type
  const success = check(response, {
    "status is 200 or acceptable": (r) => {
      // Some endpoints might return 401 for unauthenticated requests, which is acceptable
      return (
        r.status === 200 ||
        (r.status === 401 && selectedEndpoint.includes("/users/"))
      );
    },
    "response time < 1000ms": (r) => r.timings.duration < 1000,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "response has data": (r) => {
      if (r.status !== 200) return true; // Skip data check for non-200 responses
      try {
        const data = JSON.parse(r.body);
        return (
          data &&
          (Array.isArray(data) ||
            (data.data && Array.isArray(data.data)) ||
            (typeof data === "object" && data !== null))
        );
      } catch {
        return false;
      }
    },
    "content type is JSON": (r) =>
      r.headers["Content-Type"]?.includes("application/json"),
  });

  // Record error rate
  errorRate.add(!success);

  // Check for cache headers (indicates caching is working)
  const hasCacheHeaders =
    response.headers["Cache-Control"] ||
    response.headers["ETag"] ||
    response.headers["Last-Modified"];
  cacheHitRate.add(!!hasCacheHeaders);

  // Log errors for debugging
  if (!success) {
    Logger.error(`Request failed: ${url} - Status: ${response.status}`, {
      url,
      status: response.status,
      endpoint: selectedEndpoint
    });
    if (response.status >= 500) {
      Logger.error(`Server error response`, {
        url,
        status: response.status,
        responseBody: response.body.substring(0, 200)
      });
    }
  }

  // Test additional endpoints occasionally
  if (Math.random() < 0.1) {
    // 10% chance
    testTransactionDetails();
  }

  if (Math.random() < 0.05) {
    // 5% chance
    testFraudAnalysis();
  }

  // Simulate realistic user behavior with think time
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds between requests
}

// Setup function - runs once before the test
export function setup() {
  Logger.info("🚀 Starting load test for African Property Trust API");
  Logger.info(`📍 Target URL: ${BASE_URL}/api/properties`);
  Logger.info("📊 Test scenarios:");
  Logger.info("   1. Baseline: 50 RPS for 2 minutes");
  Logger.info("   2. Spike: 50→100→50 RPS");
  Logger.info("   3. Stress: 50→200 RPS gradual increase");

  // Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    Logger.error(`Health check failed: ${healthCheck.status}`, {
      url: `${BASE_URL}/health`,
      status: healthCheck.status
    });
    throw new Error(`Health check failed: ${healthCheck.status}`);
  }

  Logger.info("✅ Server health check passed");
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after the test
export function teardown(_data) {
  Logger.info("🏁 Load test completed");
  Logger.info("📈 Check the results above for performance metrics");
  Logger.info("💡 Key metrics to review:");
  Logger.info("   - http_req_duration (response times)");
  Logger.info("   - http_req_failed (error rate)");
  Logger.info("   - cache_hits (caching effectiveness)");
  Logger.info("   - Custom error rate and response time trends");
}

// Helper function for authenticated requests (if needed)
export function testAuthenticatedEndpoints() {
  if (authTokens.length === 0) return;

  const headers = {
    Authorization: authTokens[0],
    "Content-Type": "application/json",
  };

  // Test user-specific endpoints
  const userEndpoints = [
    "/api/users/profile",
    "/api/properties/favorites",
    "/api/trust/score",
  ];

  userEndpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint}`, { headers });
    check(response, {
      [`${endpoint} status is 200 or 401`]: (r) =>
        r.status === 200 || r.status === 401,
    });
  });
}

// Performance test for specific property details
export function testPropertyDetails() {
  // Test property detail endpoint with various IDs
  const propertyIds = ["1", "2", "3", "4", "5"];
  const randomId = propertyIds[Math.floor(Math.random() * propertyIds.length)];

  const response = http.get(`${BASE_URL}/api/properties/${randomId}`);

  check(response, {
    "property detail status is 200 or 404": (r) =>
      r.status === 200 || r.status === 404,
    "property detail response time < 300ms": (r) => r.timings.duration < 300,
  });
}

// Test search functionality under load
export function testSearchFunctionality() {
  const searchQueries = [
    "apartment nairobi",
    "house mombasa",
    "villa kisumu",
    "office space",
    "commercial property",
  ];

  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const response = http.get(
    `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`
  );

  check(response, {
    "search status is 200": (r) => r.status === 200,
    "search response time < 800ms": (r) => r.timings.duration < 800,
    "search has results": (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && data.results;
      } catch {
        return false;
      }
    },
  });
}

// Test transaction details endpoint
export function testTransactionDetails() {
  const transactionIds = ["1", "2", "3", "4", "5"];
  const randomId =
    transactionIds[Math.floor(Math.random() * transactionIds.length)];

  const response = http.get(`${BASE_URL}/api/transactions/${randomId}`);

  check(response, {
    "transaction detail status is 200 or 404": (r) =>
      r.status === 200 || r.status === 404,
    "transaction detail response time < 400ms": (r) => r.timings.duration < 400,
    "transaction has required fields": (r) => {
      if (r.status !== 200) return true;
      try {
        const data = JSON.parse(r.body);
        return data && data.id && data.amount && data.transactionType;
      } catch {
        return false;
      }
    },
  });
}

// Test fraud analysis endpoints
export function testFraudAnalysis() {
  const fraudEndpoints = [
    "/api/fraud/properties",
    "/api/fraud/transactions",
    "/api/fraud/users",
    "/api/fraud/analysis",
  ];

  const endpoint =
    fraudEndpoints[Math.floor(Math.random() * fraudEndpoints.length)];
  const response = http.get(`${BASE_URL}${endpoint}`);

  check(response, {
    "fraud analysis status is 200": (r) => r.status === 200,
    "fraud analysis response time < 600ms": (r) => r.timings.duration < 600,
    "fraud analysis has data": (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && (Array.isArray(data) || typeof data === "object");
      } catch {
        return false;
      }
    },
  });
}

// Test statistics aggregation endpoints
export function testStatisticsEndpoints() {
  const statsEndpoints = [
    "/api/statistics/properties",
    "/api/statistics/transactions",
    "/api/statistics/users",
    "/api/statistics/fraud",
    "/api/statistics/engagement",
  ];

  const endpoint =
    statsEndpoints[Math.floor(Math.random() * statsEndpoints.length)];
  const response = http.get(`${BASE_URL}${endpoint}`);

  check(response, {
    "statistics status is 200": (r) => r.status === 200,
    "statistics response time < 500ms": (r) => r.timings.duration < 500,
    "statistics has metrics": (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && (data.metrics || data.data || Array.isArray(data));
      } catch {
        return false;
      }
    },
  });
}
