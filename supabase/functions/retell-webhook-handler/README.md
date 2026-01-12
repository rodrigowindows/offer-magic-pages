# Retell Webhook Handler Tests

This directory contains tests for the Retell webhook handler Edge Function.

## Prerequisites

To run these tests, you need Deno installed on your system.

### Installing Deno

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**Or download from:** https://deno.land/

## Running Tests

Navigate to this directory and run:

```bash
deno test --allow-env index.test.ts
```

## Test Coverage

The test suite covers:

1. **CORS Handling**: Tests that OPTIONS requests return proper CORS headers
2. **Phone Matching**: Tests property lookup by phone number in various formats
3. **No Match Scenarios**: Tests behavior when no property is found
4. **Error Handling**: Tests invalid JSON payloads and error responses

## Test Structure

- `index.test.ts`: Main test file with comprehensive test cases
- Uses Deno's built-in testing framework and mocking utilities
- Mocks Supabase client and environment variables for isolated testing

## Mock Data

Tests use mock data representing a typical property with:
- ID: test-prop-1
- Address: 123 Test St, Orlando, FL 32801
- Owner: John Doe
- Phone: +12405814595

## Running Individual Tests

To run a specific test:

```bash
deno test --allow-env index.test.ts --filter "OPTIONS request"
```

## Integration Testing

For integration testing with real Supabase:

1. Set up your environment variables:
   ```bash
   export SUPABASE_URL=your_supabase_url
   export SUPABASE_ANON_KEY=your_anon_key
   ```

2. Deploy the function:
   ```bash
   supabase functions deploy retell-webhook-handler
   ```

3. Test with curl:
   ```bash
   curl -X POST 'your-function-url' \
     -H 'Content-Type: application/json' \
     -d '{"event": "call_ended", "call": {"call_id": "test", "from_number": "+12405814595"}}'
   ```