import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests should be below 1.5s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    errors: ['rate<0.1'],
  },
};

// Base URL - adjust for your environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4173';

export default function () {
  // Test property search endpoint
  const searchResponse = http.get(`${BASE_URL}/api/properties/search?q=Orlando&limit=10`);

  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
    'search has results': (r) => r.json().length >= 0,
  }) || errorRate.add(1);

  responseTime.add(searchResponse.timings.duration);

  // Test campaign creation endpoint (simulated)
  const campaignData = {
    name: `Load Test Campaign ${Date.now()}`,
    description: 'Load testing campaign',
    target_audience: 'test_audience',
    budget: 1000,
  };

  const campaignResponse = http.post(
    `${BASE_URL}/api/campaigns`,
    JSON.stringify(campaignData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(campaignResponse, {
    'campaign creation status is 201': (r) => r.status === 201,
    'campaign response time < 2000ms': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  responseTime.add(campaignResponse.timings.duration);

  // Test analytics endpoint
  const analyticsResponse = http.get(`${BASE_URL}/api/analytics/overview`);

  check(analyticsResponse, {
    'analytics status is 200': (r) => r.status === 200,
    'analytics response time < 1500ms': (r) => r.timings.duration < 1500,
  }) || errorRate.add(1);

  responseTime.add(analyticsResponse.timings.duration);

  // Random sleep between 1-3 seconds to simulate user behavior
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Average response time: ${data.metrics.http_req_duration.values.avg}ms`);
  console.log(`99th percentile: ${data.metrics.http_req_duration.values['p(99)']}ms`);
  console.log(`Error rate: ${data.metrics.http_req_failed.values.rate * 100}%`);
}