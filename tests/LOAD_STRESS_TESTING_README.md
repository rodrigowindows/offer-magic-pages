# Load and Stress Testing Guide

This guide explains how to run load and stress tests for the application using k6 and Artillery.

## Prerequisites

### For Load Testing (k6)
```bash
# Install k6 globally
npm install -g k6

# Or download from https://k6.io/docs/get-started/installation/
```

### For Stress Testing (Artillery)
```bash
# Install Artillery globally
npm install -g artillery
```

## Test Types

### 1. Load Testing
Load testing simulates real-world usage patterns to ensure the application can handle expected traffic.

#### API Load Test
Tests the main API endpoints under various load conditions:
- Property search operations
- Campaign creation
- Analytics queries

```bash
# Run API load test
npm run test:load

# Or directly with k6
k6 run tests/load/api-load-test.js
```

#### Database Load Test
Tests database operations under concurrent load:
- Property data retrieval
- Campaign data insertion
- Analytics aggregation queries
- Bulk property updates

```bash
# Run database load test
npm run test:load:db

# Or directly with k6
k6 run tests/load/database-load-test.js
```

### 2. Stress Testing
Stress testing pushes the application beyond normal operational capacity to find breaking points.

```bash
# Run stress test
npm run test:stress

# Or directly with Artillery
artillery run tests/stress/stress-test.yml
```

## Test Configuration

### Environment Variables

Set these environment variables for your tests:

```bash
# For API load tests
export BASE_URL="http://localhost:4173"

# For database load tests
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

### Test Scenarios

#### Load Test Stages
1. **Warm-up**: Gradual increase to 100 users over 2 minutes
2. **Sustained Load**: 100 users for 5 minutes
3. **Peak Load**: Ramp up to 200 users over 2 minutes
4. **Extended Peak**: 200 users for 5 minutes
5. **Cool-down**: Ramp down to 0 users

#### Stress Test Phases
1. **Warm-up**: 5 requests/second for 1 minute
2. **Ramp-up**: Increase to 50 requests/second over 2 minutes
3. **Sustained Stress**: 50 requests/second for 5 minutes
4. **Peak Stress**: 100 requests/second for 1 minute
5. **Recovery**: 10 requests/second for 1 minute

## Performance Thresholds

### Load Test Thresholds
- 99% of requests should complete in < 1.5 seconds
- Error rate should be < 10%
- Database operations should complete in < 2 seconds (95th percentile)

### Stress Test Scenarios
- **Property Search** (40%): Tests search functionality under load
- **Campaign Creation** (30%): Tests campaign management operations
- **Analytics Dashboard** (20%): Tests reporting and analytics
- **Mixed Operations** (10%): Tests bulk operations and complex workflows

## Running Tests in CI/CD

The load testing pipeline runs automatically:
- **Manual trigger**: Via GitHub Actions workflow dispatch
- **Scheduled**: Every Monday at 2 AM UTC

### CI/CD Configuration
- Tests run on Ubuntu latest
- Results are uploaded as artifacts
- Separate jobs for load and stress testing

## Interpreting Results

### k6 Load Test Output
```
✓ search status is 200
✓ search response time < 1000ms
✓ search has results

http_req_duration..............: avg=234.56ms min=123.45ms med=200.12ms max=987.65ms p(95)=456.78ms p(99)=789.01ms
http_req_failed................: 0.02%   ✓ < 0.1
```

### Artillery Stress Test Output
```
Phase 0 Warm up completed
Phase 1 Ramp up load completed
Phase 2 Sustained load completed

All virtual users finished
Summary report @ 15:30:45(+0000) 2024-01-15
Scenarios launched:  1500
Scenarios completed: 1485
Requests completed:  44550
Mean response/sec: 123.45
Response time (msec):
  min: 45.6
  max: 2345.6
  median: 234.5
  p95: 567.8
  p99: 1234.5
```

## Troubleshooting

### Common Issues

1. **k6 not found**: Install k6 globally or use npx
2. **Artillery not found**: Install artillery globally or use npx
3. **Connection refused**: Ensure the application is running on the correct port
4. **Database connection errors**: Check Supabase credentials and network connectivity

### Performance Tuning

If tests fail due to performance issues:
1. Check server resource utilization (CPU, memory)
2. Review database query performance
3. Optimize API response times
4. Consider implementing caching strategies
5. Review rate limiting and throttling mechanisms

## Best Practices

1. **Run tests in staging first**: Test against staging environment before production
2. **Monitor system resources**: Track CPU, memory, and network usage during tests
3. **Gradual load increase**: Start with low load and gradually increase
4. **Multiple test runs**: Run tests multiple times to account for variability
5. **Baseline measurements**: Establish performance baselines for comparison

## Integration with CI/CD

The load testing workflow integrates with the main CI/CD pipeline:
- Runs after successful unit and integration tests
- Provides performance regression detection
- Generates detailed reports for analysis
- Can block deployments if performance thresholds are not met