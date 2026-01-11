#!/usr/bin/env node

// Test script for Retell webhook handler
// Run with: node test-retell-webhook.js

const https = require('https');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Sample Retell webhook payload
const testPayload = {
  "event": "call_ended",
  "call": {
    "call_type": "phone_call",
    "from_number": "+12137771234",
    "to_number": "+12137771235",
    "direction": "inbound",
    "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
    "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
    "call_status": "registered",
    "metadata": {},
    "retell_llm_dynamic_variables": {
      "customer_name": "John Doe"
    },
    "start_timestamp": 1714608475945,
    "end_timestamp": 1714608491736,
    "disconnection_reason": "user_hangup",
    "transcript": "Hello, I'm calling about my property...",
    "opt_out_sensitive_data_storage": false
  }
};

const webhookUrl = `${SUPABASE_URL}/functions/v1/retell-webhook-handler`;

console.log('Testing Retell webhook handler...');
console.log('URL:', webhookUrl);
console.log('Payload:', JSON.stringify(testPayload, null, 2));

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
};

const req = https.request(webhookUrl, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Status:', res.statusCode);
    console.log('Response Headers:', res.headers);

    try {
      const response = JSON.parse(data);
      console.log('\nResponse Body:');
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('\nRaw Response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error);
});

req.write(JSON.stringify(testPayload));
req.end();