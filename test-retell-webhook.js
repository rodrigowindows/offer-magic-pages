// Test script for Retell webhook
// Run with: node test-retell-webhook.js

const WEBHOOK_URL = 'https://atxudkblyyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler';

const testPayload = {
  event: 'call_inbound',
  call_inbound: {
    call_id: 'test_call_123',
    from_number: '+12405814595',
    to_number: '+17868828251',
    agent_id: 'agent_test123'
  }
};

async function testWebhook() {
  console.log('🧪 Testing Retell webhook...\n');
  console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();

    console.log('\n📥 Response Status:', response.status);
    console.log('\n📥 Response Data:', JSON.stringify(data, null, 2));

    if (data.call_inbound && data.call_inbound.dynamic_variables) {
      console.log('\n✅ SUCCESS! Correct Retell format');
      console.log('\n📊 Dynamic Variables:', JSON.stringify(data.call_inbound.dynamic_variables, null, 2));
    } else {
      console.log('\n❌ WRONG FORMAT!');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testWebhook();
