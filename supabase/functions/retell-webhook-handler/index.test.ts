import { assertEquals, assertExists } from "https://deno.land/std@0.190.0/testing/asserts.ts";

// Mock the Supabase module before importing the handler
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns: string) => ({
      or: (condition: string) => ({
        limit: (num: number) => Promise.resolve({
          data: table === 'properties' && condition.includes('+12405814595') ? [
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
        contains: (field: string, arr: any[]) => Promise.resolve({
          data: [],
          error: null
        }),
        data: [],
        error: null
      }),
      contains: (field: string, arr: any[]) => Promise.resolve({
        data: [],
        error: null
      }),
      data: [],
      error: null
    }),
    functions: {
      invoke: () => Promise.resolve({
        data: { success: true, data: [] },
        error: null
      })
    }
  })
};

// Mock createClient function
const mockCreateClient = () => mockSupabaseClient;

// Use Deno's mock to intercept the import
import { stub } from "https://deno.land/std@0.190.0/testing/mock.ts";

const supabaseStub = stub(Deno, "env", {
  get: (key: string) => {
    if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
    if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
    return undefined;
  }
});

// Import the handler after setting up mocks
import { handleRetellWebhook } from "./index.ts";

Deno.test("OPTIONS request returns CORS headers", async () => {
  const req = new Request("http://localhost", {
    method: "OPTIONS",
  });

  const response = await handleRetellWebhook(req);
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Access-Control-Allow-Headers"), "authorization, x-client-info, apikey, content-type");
});

Deno.test("Webhook with matching phone returns property info", async () => {
  // Mock the createClient import
  const createClientStub = stub(globalThis, "createClient", mockCreateClient);

  try {
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

    const response = await handleRetellWebhook(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.success, true);
    assertEquals(result.result.property_found, true);
    assertEquals(result.result.matched_by, "exact_phone");
    assertExists(result.result.property_info);
    assertEquals(result.result.property_info.owner_name, "John Doe");
  } finally {
    createClientStub.restore();
  }
});

Deno.test("Webhook with non-matching phone returns no property", async () => {
  const createClientStub = stub(globalThis, "createClient", mockCreateClient);

  try {
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

    const response = await handleRetellWebhook(req);
    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(result.success, true);
    assertEquals(result.result.property_found, false);
    assertEquals(result.result.matched_by, null);
    assertEquals(result.result.property_info, null);
  } finally {
    createClientStub.restore();
  }
});

Deno.test("Invalid JSON returns error", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "invalid json"
  });

  const response = await handleRetellWebhook(req);
  const result = await response.json();

  assertEquals(response.status, 500);
  assertExists(result.error);
});

// Cleanup
Deno.test({
  name: "cleanup",
  fn: () => {
    supabaseStub.restore();
  },
  sanitizeOps: false,
  sanitizeResources: false
});