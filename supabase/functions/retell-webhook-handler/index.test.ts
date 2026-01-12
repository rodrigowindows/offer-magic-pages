import { assertEquals, assertExists } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Mock Supabase client
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns: string) => ({
      or: (condition: string) => ({
        limit: (num: number) => ({
          data: table === 'properties' ? [
            {
              id: 'test-prop-1',
              address: '123 Test St',
              city: 'Orlando',
              state: 'FL',
              zip_code: '32801',
              owner_name: 'John Doe',
              estimated_value: 300000,
              cash_offer_amount: 250000,
              owner_phone: '+12405814595',
              tags: [],
              skip_tracing_data: null
            }
          ] : [],
          error: null
        })
      }),
      not: (column: string, op: string, value: any) => ({
        contains: (field: string, arr: any[]) => ({
          data: [],
          error: null
        }),
        data: [],
        error: null
      }),
      contains: (field: string, arr: any[]) => ({
        data: [],
        error: null
      }),
      data: [],
      error: null
    }),
    functions: {
      invoke: () => ({
        data: { success: true, data: [] },
        error: null
      })
    }
  })
};

// Mock createClient
const createClient = () => mockSupabaseClient;

// Mock Deno.env
const originalEnv = Deno.env;
Deno.env = {
  get: (key: string) => {
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
    return originalEnv.get(key);
  }
};

// Import the handler after mocking
import handler from "./index.ts";

Deno.test("OPTIONS request returns CORS headers", async () => {
  const req = new Request("http://localhost", {
    method: "OPTIONS",
  });

  const response = await handler(req);
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Access-Control-Allow-Headers"), "authorization, x-client-info, apikey, content-type");
});

Deno.test("Webhook with matching phone returns property info", async () => {
  const payload = {
    event: "call_ended",
    call: {
      call_id: "test-call-123",
      from_number: "+12405814595",
      to_number: "+12405814595",
      direction: "inbound",
      call_status: "completed",
      disconnection_reason: "user_hangup",
      start_timestamp: 1714608475945,
      end_timestamp: 1714608491736
    }
  };

  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const response = await handler(req);
  const result = await response.json();

  assertEquals(response.status, 200);
  assertEquals(result.success, true);
  assertEquals(result.result.property_found, true);
  assertEquals(result.result.matched_by, "exact_phone");
  assertExists(result.result.property_info);
  assertEquals(result.result.property_info.owner_name, "John Doe");
});

Deno.test("Webhook with non-matching phone returns no property", async () => {
  const payload = {
    event: "call_ended",
    call: {
      call_id: "test-call-456",
      from_number: "+19999999999",
      to_number: "+12405814595",
      direction: "inbound",
      call_status: "completed",
      disconnection_reason: "user_hangup",
      start_timestamp: 1714608475945,
      end_timestamp: 1714608491736
    }
  };

  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const response = await handler(req);
  const result = await response.json();

  assertEquals(response.status, 200);
  assertEquals(result.success, true);
  assertEquals(result.result.property_found, false);
  assertEquals(result.result.matched_by, null);
  assertEquals(result.result.property_info, null);
});

Deno.test("Invalid JSON returns error", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "invalid json"
  });

  const response = await handler(req);
  const result = await response.json();

  assertEquals(response.status, 500);
  assertExists(result.error);
});

// Restore original env after tests
Deno.test({
  name: "cleanup",
  fn: () => {
    Deno.env = originalEnv;
  },
  sanitizeOps: false,
  sanitizeResources: false
});