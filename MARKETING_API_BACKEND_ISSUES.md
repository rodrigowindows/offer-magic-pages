# Marketing API Backend Issues - Action Required

## ⚠️ Summary

The frontend React application is correctly configured and sending proper requests to `https://marketing.workfaraway.com/mcp`. However, the **backend server** has two critical bugs that prevent calls from working.

---

## 🔍 Issue #1: Incorrect Retell API Endpoint

### Current Behavior (Wrong)
The backend is calling:
```
https://api.retellai.com/v2/create-phone-call
```

**Result:** 404 Not Found

### Required Fix
Update to:
```
https://api.retellai.com/create-phone-call
```

### Error Message from Backend
```json
{
  "operation": "initiate_call",
  "result": {
    "error": "Retell API Error: 404 Client Error: Not Found for url: https://api.retellai.com/v2/create-phone-call"
  },
  "status": "error"
}
```

### Where to Fix
In the backend marketing API server code (Python/Node.js), find where the Retell API is called and remove `/v2` from the URL.

**Python Example:**
```python
# WRONG
url = "https://api.retellai.com/v2/create-phone-call"

# CORRECT
url = "https://api.retellai.com/create-phone-call"
```

**Node.js Example:**
```javascript
// WRONG
const url = 'https://api.retellai.com/v2/create-phone-call';

// CORRECT
const url = 'https://api.retellai.com/create-phone-call';
```

---

## 🔍 Issue #2: Phone Number Double Prefix

### Current Behavior (Wrong)
When the frontend sends:
```json
{
  "from_number": "+14075555555"
}
```

The backend converts it to:
```
+1+14075555555
```

**Result:** "Item +1+14075555555 not found from phone-number"

### Error Message from Backend
```json
{
  "details": {
    "message": "Item +1+14075555555 not found from phone-number",
    "status": "error"
  }
}
```

### Root Cause
The backend is adding a `+1` prefix to phone numbers that already have it.

### Required Fix
In the backend code, check if the phone number already starts with `+1` before adding the prefix:

**Python Example:**
```python
# WRONG
phone_number = "+1" + data['from_number']

# CORRECT
phone_number = data['from_number']
if not phone_number.startswith('+'):
    phone_number = '+1' + phone_number
```

**Node.js Example:**
```javascript
// WRONG
const phoneNumber = '+1' + data.from_number;

// CORRECT
let phoneNumber = data.from_number;
if (!phoneNumber.startsWith('+')) {
    phoneNumber = '+1' + phoneNumber;
}
```

---

## ✅ Frontend Status

The frontend React application is **fully functional** and correctly configured:

- ✅ Environment variable set to `https://marketing.workfaraway.com`
- ✅ Calling `/mcp` endpoint with correct structure
- ✅ Sending proper JSON payload:
  ```json
  {
    "operation": "initiate_call",
    "data": {
      "name": "John Doe",
      "from_number": "+14075555555",
      "to_number": "+12405814595",
      "address": "123 Main St",
      "voicemail_drop": false,
      "seller_name": "MyLocalInvest",
      "test_mode": false
    }
  }
  ```
- ✅ Template rendering working (images, maps, variables)
- ✅ Error handling implemented

---

## 🧪 Test Results

### Test Request
```bash
curl -X POST https://marketing.workfaraway.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "operation":"initiate_call",
    "data":{
      "name":"Test",
      "from_number":"+14075555555",
      "to_number":"+12405814595",
      "address":"123 Main St"
    }
  }'
```

### Current Response (With Errors)
```json
{
  "operation": "initiate_call",
  "result": {
    "details": {
      "message": "Item +1+14075555555 not found from phone-number",
      "status": "error"
    },
    "error": "Retell API Error: 404 Client Error: Not Found for url: https://api.retellai.com/v2/create-phone-call"
  },
  "status": "error"
}
```

### Expected Response (After Fix)
```json
{
  "operation": "initiate_call",
  "result": {
    "call_id": "call_abc123xyz",
    "status": "queued",
    "phone": "+12405814595"
  },
  "status": "ok"
}
```

---

## 🚀 Action Items

1. **Fix Retell API URL** - Remove `/v2` from the endpoint
2. **Fix Phone Number Formatting** - Don't add `+1` if already present
3. **Test Backend** - Verify the fixes work with the curl command above
4. **Restart Backend Server** - Apply the changes

---

## 📞 Backend Server Location

The backend that needs to be fixed is:
```
https://marketing.workfaraway.com
```

This is **NOT** the React frontend. This is a separate Python/Node.js API server that handles marketing operations.

---

## 🔗 Related Files (Frontend - Already Correct)

- `Step 5 - Outreach & Campaigns/.env` - Line 5: `VITE_MARKETING_API_URL="https://marketing.workfaraway.com"`
- `Step 5 - Outreach & Campaigns/src/services/marketingService.ts` - Lines 219-221: Correct `/mcp` call
- `Step 5 - Outreach & Campaigns/MARKETING_API_SPECIFICATION.md` - API documentation

---

## ✅ Once Backend is Fixed

After fixing the backend issues, test from the React app:

1. Open Campaign Manager
2. Create a call campaign
3. Select property with phone number
4. Click "Send Test"
5. Should successfully initiate call and return `call_id`

---

## Last Updated
2026-01-13

## Status
🔴 **Blocked** - Waiting for backend fixes at marketing.workfaraway.com
