# Marketing API Specification - Call Service Integration

## 🎯 Overview

This document specifies the requirements for the Marketing Call API endpoint that handles phone call campaigns for real estate leads.

---

## 📍 Current Endpoint

```
POST https://marketing.workfaraway.com/mcp
```

**Current Status**: 404 (Not Found) ❌

---

## 📋 API Request Specification

### HTTP Method
```
POST
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### Request Body Parameters

```typescript
interface CallRequest {
  operation: "initiate_call";
  phone: string;           // E.164 format: +1XXXXXXXXXX or (XXX) XXX-XXXX
  message: string;         // Voicemail message template (already personalized)
  property_id?: string;    // UUID of the property
  campaign_id?: string;    // UUID of the campaign
  metadata?: {
    property_address?: string;
    owner_name?: string;
    template_id?: string;
    template_name?: string;
  };
}
```

### Example Request

```json
{
  "operation": "initiate_call",
  "phone": "(240) 581-4595",
  "message": "Hi John, this is MyLocalInvest. We're interested in making a cash offer for your property at 1025 S WASHINGTON AVE. We can close in as little as 7 days. Please visit https://offer.mylocalinvest.com/property/1025-s-washington-ave or call us back at (555) 123-4567. Thank you!",
  "property_id": "550e8400-e29b-41d4-a716-446655440000",
  "campaign_id": "650e8400-e29b-41d4-a716-446655440001",
  "metadata": {
    "property_address": "1025 S WASHINGTON AVE",
    "owner_name": "John Doe",
    "template_id": "call-voicemail-default",
    "template_name": "Default Voicemail"
  }
}
```

---

## ✅ Expected Success Response

### Status Code
```
200 OK
```

### Response Body

```typescript
interface CallSuccessResponse {
  status: "success";
  operation: "initiate_call";
  result: {
    call_id: string;          // Unique identifier for this call
    phone: string;            // Phone number called
    status: "queued" | "initiated" | "ringing" | "answered" | "voicemail";
    timestamp: string;        // ISO 8601 timestamp
    estimated_duration?: number;  // Estimated duration in seconds
    cost?: number;            // Cost in USD
  };
}
```

### Example Success Response

```json
{
  "status": "success",
  "operation": "initiate_call",
  "result": {
    "call_id": "call_abc123xyz",
    "phone": "(240) 581-4595",
    "status": "queued",
    "timestamp": "2026-01-13T14:30:00Z",
    "estimated_duration": 30,
    "cost": 0.02
  }
}
```

---

## ❌ Error Responses

### 1. Invalid Phone Number

**Status Code**: `400 Bad Request`

```json
{
  "status": "error",
  "operation": "initiate_call",
  "result": {
    "error_code": "INVALID_PHONE",
    "message": "Phone number format is invalid. Expected E.164 format.",
    "phone": "(240) 581-4595"
  }
}
```

### 2. DNC (Do Not Call) List

**Status Code**: `403 Forbidden`

```json
{
  "status": "error",
  "operation": "initiate_call",
  "result": {
    "error_code": "DNC_VIOLATION",
    "message": "Phone number is on Do Not Call list",
    "phone": "(240) 581-4595"
  }
}
```

### 3. Rate Limit Exceeded

**Status Code**: `429 Too Many Requests`

```json
{
  "status": "error",
  "operation": "initiate_call",
  "result": {
    "error_code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many calls initiated. Please retry after cooldown period.",
    "retry_after": 60
  }
}
```

### 4. Insufficient Credits

**Status Code**: `402 Payment Required`

```json
{
  "status": "error",
  "operation": "initiate_call",
  "result": {
    "error_code": "INSUFFICIENT_CREDITS",
    "message": "Account has insufficient credits to make this call",
    "required_credits": 0.02,
    "available_credits": 0.00
  }
}
```

### 5. Service Unavailable

**Status Code**: `503 Service Unavailable`

```json
{
  "status": "error",
  "operation": "initiate_call",
  "result": {
    "error_code": "SERVICE_UNAVAILABLE",
    "message": "Call service is temporarily unavailable. Please retry later.",
    "retry_after": 300
  }
}
```

### 6. Endpoint Not Found (Current Issue)

**Status Code**: `404 Not Found`

```json
{
  "status": "error",
  "operation": "initiate_call",
  "result": {
    "error_code": "ENDPOINT_NOT_FOUND",
    "message": "The requested endpoint does not exist"
  }
}
```

---

## 🔄 Call Status Webhook (Optional)

If the service supports webhooks, provide a callback URL to receive call status updates:

### Webhook URL Format
```
POST https://offer.mylocalinvest.com/api/webhooks/call-status
```

### Webhook Payload

```typescript
interface CallStatusWebhook {
  event: "call.queued" | "call.initiated" | "call.ringing" | "call.answered" | "call.completed" | "call.failed" | "call.voicemail";
  call_id: string;
  phone: string;
  timestamp: string;
  duration?: number;      // Duration in seconds (for completed calls)
  recording_url?: string; // URL to call recording (if available)
  status_details?: {
    answered: boolean;
    voicemail_left: boolean;
    hang_up_reason?: string;
  };
}
```

### Example Webhook

```json
{
  "event": "call.completed",
  "call_id": "call_abc123xyz",
  "phone": "(240) 581-4595",
  "timestamp": "2026-01-13T14:31:45Z",
  "duration": 35,
  "recording_url": "https://recordings.example.com/call_abc123xyz.mp3",
  "status_details": {
    "answered": false,
    "voicemail_left": true,
    "hang_up_reason": "voicemail"
  }
}
```

---

## 🔐 Authentication

### API Key Authentication (Recommended)

Include API key in headers:

```http
Authorization: Bearer YOUR_API_KEY_HERE
X-API-Key: YOUR_API_KEY_HERE
```

### OR Basic Authentication

```http
Authorization: Basic base64(username:password)
```

---

## 📊 Rate Limits

Recommended rate limits to prevent abuse:

- **Per Account**: 100 calls per minute
- **Per Phone Number**: 1 call per 15 minutes (prevent spam)
- **Daily Limit**: 1000 calls per day per account

---

## 🧪 Testing

### Test Phone Numbers

Provide test phone numbers that simulate different scenarios:

```
+15555550100 - Always answers
+15555550101 - Goes to voicemail
+15555550102 - Busy signal
+15555550103 - Invalid number
+15555550104 - DNC violation
```

### Sandbox Endpoint

```
POST https://marketing.workfaraway.com/mcp/sandbox
```

---

## 📝 Implementation Notes

### Current Application Behavior

The application currently:

1. ✅ Generates personalized voicemail messages using templates
2. ✅ Validates phone numbers before sending
3. ✅ Handles multiple phone number formats
4. ✅ Tracks campaign progress and success/failure
5. ✅ Logs all call attempts to database
6. ❌ **Fails when endpoint returns 404**

### Error Handling in Application

The application handles errors as follows:

```typescript
try {
  const response = await axios.post('https://marketing.workfaraway.com/mcp', {
    operation: 'initiate_call',
    phone: formattedPhone,
    message: voicemailMessage,
    property_id: property.id,
    campaign_id: campaignId,
    metadata: {
      property_address: property.address,
      owner_name: property.owner_name,
      template_id: template.id,
      template_name: template.name
    }
  });

  if (response.data.status === 'success') {
    // Log success to database
    await logCampaignSuccess(property.id, response.data.result);
  }
} catch (error) {
  // Currently catching 404 error
  console.error('Call failed:', error);
  // Log failure to database
  await logCampaignFailure(property.id, error);
}
```

---

## 🚀 Migration Checklist

To fix the current 404 error, the marketing service provider needs to:

- [ ] Verify endpoint URL is correct: `https://marketing.workfaraway.com/mcp`
- [ ] Ensure endpoint is deployed and accessible
- [ ] Implement the request/response format specified above
- [ ] Add proper error handling
- [ ] Test with sample requests
- [ ] Provide API documentation
- [ ] Share API key for authentication
- [ ] Configure CORS if needed: `https://offer.mylocalinvest.com`
- [ ] Set up monitoring and alerting
- [ ] Provide support contact for issues

---

## 📞 Support & Contact

**Application Owner**: MyLocalInvest
**Contact**: admin@mylocalinvest.com
**Application URL**: https://offer.mylocalinvest.com

**Current Error**:
```
POST https://marketing.workfaraway.com/mcp 404 (Not Found)
Call failed for (240) 581-4595: AxiosError: Request failed with status code 404
```

**Expected Fix**: Marketing service provider to deploy the endpoint and confirm functionality.

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-13 | Initial specification |

---

## 🔗 Related Resources

- [Application Dashboard](https://offer.mylocalinvest.com/admin)
- [Campaign Manager](https://offer.mylocalinvest.com/admin/campaigns)
- [API Logs](https://offer.mylocalinvest.com/admin/logs)
