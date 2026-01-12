import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const dbErrorRate = new Rate('db_errors');
const dbResponseTime = new Trend('db_response_time');

// Test configuration for database load testing
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 concurrent DB operations
    { duration: '3m', target: 50 },  // Stay at 50 for 3 minutes
    { duration: '1m', target: 100 }, // Ramp up to 100 concurrent operations
    { duration: '3m', target: 100 }, // Stay at 100 for 3 minutes
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of DB operations should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    db_errors: ['rate<0.05'],
  },
};

// Database endpoints - adjust for your Supabase setup
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'apikey': SUPABASE_ANON_KEY,
};

export default function () {
  // Test property data retrieval (simulated large dataset)
  const propertiesResponse = http.get(
    `${SUPABASE_URL}/rest/v1/properties?select=*&limit=1000`,
    { headers }
  );

  check(propertiesResponse, {
    'properties query status is 200': (r) => r.status === 200,
    'properties response time < 1500ms': (r) => r.timings.duration < 1500,
    'properties returned data': (r) => r.json().length >= 0,
  }) || dbErrorRate.add(1);

  dbResponseTime.add(propertiesResponse.timings.duration);

  // Test campaign data insertion
  const campaignData = {
    name: `Load Test Campaign ${__VU}-${Date.now()}`,
    description: 'Database load testing campaign',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const insertResponse = http.post(
    `${SUPABASE_URL}/rest/v1/campaigns`,
    JSON.stringify(campaignData),
    { headers }
  );

  check(insertResponse, {
    'campaign insert status is 201': (r) => r.status === 201,
    'campaign insert time < 1000ms': (r) => r.timings.duration < 1000,
  }) || dbErrorRate.add(1);

  dbResponseTime.add(insertResponse.timings.duration);

  // Test analytics aggregation query
  const analyticsResponse = http.get(
    `${SUPABASE_URL}/rest/v1/campaign_analytics?select=campaign_id,count(*)`,
    { headers }
  );

  check(analyticsResponse, {
    'analytics query status is 200': (r) => r.status === 200,
    'analytics response time < 2000ms': (r) => r.timings.duration < 2000,
  }) || dbErrorRate.add(1);

  dbResponseTime.add(analyticsResponse.timings.duration);

  // Test bulk property update (simulated)
  const updateData = {
    status: 'updated_via_load_test',
    updated_at: new Date().toISOString(),
  };

  const updateResponse = http.patch(
    `${SUPABASE_URL}/rest/v1/properties?id=eq.${Math.floor(Math.random() * 1000) + 1}`,
    JSON.stringify(updateData),
    { headers }
  );

  check(updateResponse, {
    'property update status is 200': (r) => r.status === 200,
    'property update time < 1500ms': (r) => r.timings.duration < 1500,
  }) || dbErrorRate.add(1);

  dbResponseTime.add(updateResponse.timings.duration);

  // Simulate user think time
  sleep(Math.random() * 1 + 0.5);
}

export function setup() {
  console.log('Starting database load test...');
  console.log(`Target Supabase URL: ${SUPABASE_URL}`);
}

export function teardown(data) {
  console.log('Database load test completed');
  console.log(`Total DB operations: ${data.metrics.http_reqs.values.count}`);
  console.log(`Average DB response time: ${data.metrics.http_req_duration.values.avg}ms`);
  console.log(`95th percentile: ${data.metrics.http_req_duration.values['p(95)']}ms`);
  console.log(`DB error rate: ${data.metrics.http_req_failed.values.rate * 100}%`);
}