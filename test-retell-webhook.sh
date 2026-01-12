#!/bin/bash

# Retell Webhook Test Script
# Este script testa o webhook do Retell AI com um exemplo real

WEBHOOK_URL="https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler"

echo "=========================================="
echo "🧪 TESTING RETELL AI WEBHOOK"
echo "=========================================="
echo ""
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Test 1: Simular chamada recebida
echo "📞 Test 1: Inbound Call from +14075551234"
echo "------------------------------------------"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_ended",
    "call": {
      "call_id": "test-abc-123",
      "call_type": "phone_call",
      "from_number": "+14075551234",
      "to_number": "+14075559999",
      "direction": "inbound",
      "call_status": "ended",
      "start_timestamp": 1714608475945,
      "end_timestamp": 1714608491736,
      "disconnection_reason": "user_hangup",
      "transcript": "Hello, I am interested in selling my property at 123 Main Street.",
      "metadata": {
        "test_mode": true,
        "campaign": "Orlando Properties"
      }
    }
  }' | jq '.'

echo ""
echo ""

# Test 2: Simular chamada com número desconhecido
echo "📞 Test 2: Inbound Call from Unknown Number"
echo "------------------------------------------"

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_ended",
    "call": {
      "call_id": "test-xyz-789",
      "call_type": "phone_call",
      "from_number": "+19999999999",
      "to_number": "+14075559999",
      "direction": "inbound",
      "call_status": "ended",
      "start_timestamp": 1714608475945,
      "end_timestamp": 1714608491736,
      "disconnection_reason": "user_hangup",
      "transcript": "Unknown caller test"
    }
  }' | jq '.'

echo ""
echo ""
echo "=========================================="
echo "✅ Tests completed!"
echo "=========================================="
