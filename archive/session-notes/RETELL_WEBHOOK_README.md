# Retell AI Webhook Integration

This integration allows Retell AI to automatically look up property information using skiptrace data when calls are received.

## Setup

1. **Configure Webhook URL in Retell AI Dashboard:**
   ```
   https://[your-supabase-project].supabase.co/functions/v1/retell-webhook-handler
   ```

2. **Environment Variables:**
   Make sure your Supabase project has the following environment variables set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## How It Works

When Retell AI sends a webhook for call events (`call_started`, `call_ended`, `call_analyzed`), the system:

1. **Extracts Phone Number:** Gets the caller's phone number from `call.from_number`

2. **Property Lookup:** Searches the properties database for matches by:
   - Exact phone number match in owner_phone, phone1-phone5 fields
   - Cleaned phone number match (digits only) for fuzzy matching

3. **Skiptrace Data:** For matched properties, fetches detailed skiptrace information including:
   - All phone numbers and emails found during skiptracing
   - Preferred contact methods
   - DNC (Do Not Call) status
   - Deceased status

4. **Returns JSON Response:** Provides structured data for Retell AI to use in call handling

## Response Format

```json
{
  "success": true,
  "result": {
    "event": "call_ended",
    "call": {
      "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
      "from_number": "+12137771234",
      "to_number": "+12137771235",
      "direction": "inbound",
      "call_status": "registered",
      "start_timestamp": 1714608475945,
      "end_timestamp": 1714608491736,
      "disconnection_reason": "user_hangup"
    },
    "property_found": true,
    "matched_by": "exact_phone",
    "property_info": {
      "id": "property-uuid",
      "address": "123 Main St",
      "city": "Orlando",
      "state": "FL",
      "zip_code": "32801",
      "owner_name": "John Doe",
      "estimated_value": 250000,
      "cash_offer_amount": 200000
    },
    "skip_trace_data": {
      "total_phones": 3,
      "total_emails": 2,
      "has_owner_info": true,
      "phones": [
        {
          "number": "+12137771234",
          "type": "Owner",
          "formatted": "(213) 777-1234"
        }
      ],
      "emails": [
        {
          "email": "john.doe@email.com",
          "type": "Owner"
        }
      ],
      "preferred_phones": ["+12137771234"],
      "preferred_emails": ["john.doe@email.com"],
      "dnc_status": "Clear",
      "deceased_status": "Active"
    },
    "processed_at": "2024-01-11T10:30:00.000Z"
  }
}
```

## Testing

Run the test script to verify the webhook handler:

```bash
node test-retell-webhook.js
```

This will send a test webhook payload and show the response.

## Use Cases

- **Dynamic Call Handling:** Use property information to customize call scripts
- **CRM Integration:** Automatically update CRM records with call data
- **Lead Qualification:** Check if caller is a property owner before connecting
- **Analytics:** Track call sources and conversion rates
- **Follow-up Campaigns:** Trigger automated email/SMS campaigns after calls

## Supported Events

- `call_started` - When a new call begins
- `call_ended` - When a call completes, transfers, or encounters an error
- `call_analyzed` - When call analysis is complete (includes transcript and analysis)

Note: `call_started` is not triggered for calls that don't connect (dial failed, no answer, busy).