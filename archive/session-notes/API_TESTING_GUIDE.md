# 🧪 API Testing Guide - Marketing Communication System

## Overview

This guide explains how to test the Marketing Communication APIs both in **Test Mode** (safe, simulated) and **Production Mode** (real communications).

---

## 🎯 Quick Answer

### Option 1: Use the Built-in UI (Recommended)
1. Start the app: `npm run dev`
2. Navigate to: `http://localhost:5173/marketing`
3. Ensure **Test Mode is ON** (orange indicator in sidebar)
4. Click "New Communication"
5. Fill in recipient info
6. Select channels (SMS, Email, Call)
7. Click through wizard steps
8. On Step 4 (Confirmation), click "Test Send"
9. Check the **History** page to see results
10. Open **DevTools Console** (F12) to see API responses

### Option 2: Use API Testing Tools
- **Postman** - GUI for API testing
- **cURL** - Command line
- **Thunder Client** - VSCode extension
- **Insomnia** - Alternative to Postman

---

## 🔧 Backend API Endpoints

Based on your specification, the backend should provide these endpoints:

### 1. Health Check
```
GET https://marketing.workfaraway.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-21T10:00:00Z"
}
```

### 2. Send Communication (Single)
```
POST https://marketing.workfaraway.com/send
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone_number": "(407) 555-1234",
  "email": "john@example.com",
  "address": "123 Main St, Orlando, FL 32801",
  "seller_name": "Jane Smith",
  "channels": ["sms", "email", "call"],
  "company_name": "Your Company LLC",
  "contact_phone": "(407) 555-9999",
  "contact_phone_alt": "(407) 555-8888",
  "website": "https://yourcompany.com",
  "city": "Orlando",
  "llm_provider": "openai",
  "llm_model": "gpt-4",
  "llm_temperature": 0.7,
  "voicemail_style": "professional",
  "custom_sms_body": "Optional custom SMS message",
  "custom_email_subject": "Optional email subject",
  "custom_email_body": "Optional email body",
  "custom_voicemail": "Optional voicemail script",
  "test_mode": true
}
```

**Expected Response (Test Mode):**
```json
{
  "success": true,
  "test_mode": true,
  "message": "Communication simulated successfully",
  "results": {
    "sms": {
      "status": "sent",
      "simulated": true,
      "message_id": "sim_sms_12345"
    },
    "email": {
      "status": "sent",
      "simulated": true,
      "message_id": "sim_email_67890"
    },
    "call": {
      "status": "sent",
      "simulated": true,
      "call_id": "sim_call_abcde"
    }
  },
  "timestamp": "2025-12-21T10:00:00Z"
}
```

**Expected Response (Production Mode):**
```json
{
  "success": true,
  "test_mode": false,
  "message": "Communication sent successfully",
  "results": {
    "sms": {
      "status": "sent",
      "message_id": "twilio_msg_12345",
      "cost": 0.0075
    },
    "email": {
      "status": "sent",
      "message_id": "sendgrid_msg_67890",
      "cost": 0.001
    },
    "call": {
      "status": "initiated",
      "call_id": "twilio_call_abcde",
      "cost": 0.013
    }
  },
  "total_cost": 0.0215,
  "timestamp": "2025-12-21T10:00:00Z"
}
```

### 3. Send Batch Communications
```
POST https://marketing.workfaraway.com/send/batch
```

**Request Body:**
```json
{
  "recipients": [
    {
      "name": "John Doe",
      "phone_number": "(407) 555-1234",
      "email": "john@example.com",
      "address": "123 Main St, Orlando, FL"
    },
    {
      "name": "Jane Smith",
      "phone_number": "(407) 555-5678",
      "email": "jane@example.com",
      "address": "456 Oak Ave, Orlando, FL"
    }
  ],
  "channels": ["sms", "email"],
  "company_name": "Your Company LLC",
  "contact_phone": "(407) 555-9999",
  "test_mode": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "test_mode": true,
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "recipient": "John Doe",
      "status": "sent",
      "channels": ["sms", "email"]
    },
    {
      "recipient": "Jane Smith",
      "status": "sent",
      "channels": ["sms", "email"]
    }
  ]
}
```

---

## 🧪 Testing Methods

### Method 1: Using the Built-in UI (Easiest)

#### Step-by-Step Test Flow

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Navigate to Marketing System**
   - Open: `http://localhost:5173/marketing`

3. **Verify Test Mode is ON**
   - Look for orange "Test Mode" indicator in sidebar
   - If OFF, toggle it ON (will show orange alert)

4. **Test Health Check (Automatic)**
   - App runs health check on load
   - Open DevTools Console (F12)
   - Look for: `Health check result: { status: "healthy" }`
   - If API is down, you'll see an error

5. **Test Single Communication**
   - Click "New Communication"
   - **Step 1**: Fill in recipient
     ```
     Name: Test User
     Phone: (407) 555-1234
     Email: test@example.com
     Address: 123 Test St, Orlando, FL
     ```
   - Click "Next"
   - **Step 2**: Select channels (SMS, Email, Call)
   - Click "Next"
   - **Step 3**: (Optional) Customize messages
   - Click "Next"
   - **Step 4**: Review and click "🧪 Test Send"
   - Watch for success toast: "🧪 Test communication sent (simulated)!"

6. **Check Results**
   - Click "History" in sidebar
   - You should see your test communication
   - It will have a "🧪 Test" badge
   - Click to expand and see full response

7. **Check Console for API Response**
   - Open DevTools Console (F12)
   - Look for API response logged
   - Verify `test_mode: true` in response

#### Testing Batch Upload

1. **Download CSV Template**
   - In Step 1, click "Download CSV Template"
   - Open the downloaded file

2. **Add Test Data**
   ```csv
   name,phone_number,email,address,seller_name
   John Doe,(407) 555-1111,john@test.com,123 Main St,Agent A
   Jane Smith,(407) 555-2222,jane@test.com,456 Oak Ave,Agent B
   Bob Johnson,(407) 555-3333,bob@test.com,789 Pine Rd,Agent C
   ```

3. **Upload CSV**
   - Drag & drop CSV file to Step 1
   - Verify: "3 recipients loaded successfully"

4. **Complete Wizard**
   - Select channels
   - Customize messages (optional)
   - Review and send
   - Watch batch progress: "Sending 1/3..." → "Sending 2/3..." → "Sending 3/3..."

5. **Verify in History**
   - Should see 3 separate communications
   - All marked with "🧪 Test" badge

---

### Method 2: Using Postman

#### Setup

1. **Install Postman**
   - Download from: https://www.postman.com/downloads/

2. **Create a New Collection**
   - Name it: "Marketing Communication API"

#### Test 1: Health Check

1. **Create Request**
   - Method: `GET`
   - URL: `https://marketing.workfaraway.com/health`
   - Click "Send"

2. **Expected Response**
   - Status: `200 OK`
   - Body:
     ```json
     {
       "status": "healthy",
       "timestamp": "2025-12-21T10:00:00Z"
     }
     ```

#### Test 2: Single Communication (Test Mode)

1. **Create Request**
   - Method: `POST`
   - URL: `https://marketing.workfaraway.com/send`
   - Headers:
     ```
     Content-Type: application/json
     ```

2. **Body (raw JSON)**
   ```json
   {
     "name": "Postman Test User",
     "phone_number": "(407) 555-1234",
     "email": "postman@test.com",
     "address": "123 Postman St, Orlando, FL",
     "channels": ["sms", "email"],
     "company_name": "Test Company",
     "contact_phone": "(407) 555-9999",
     "city": "Orlando",
     "llm_provider": "openai",
     "llm_model": "gpt-4",
     "llm_temperature": 0.7,
     "voicemail_style": "professional",
     "test_mode": true
   }
   ```

3. **Click "Send"**

4. **Verify Response**
   - Status: `200 OK`
   - Body should have:
     - `"success": true`
     - `"test_mode": true`
     - Results for each channel

#### Test 3: Production Mode (BE CAREFUL!)

⚠️ **WARNING**: This will send REAL communications and consume credits!

1. **Same as Test 2, but change:**
   ```json
   {
     "test_mode": false
   }
   ```

2. **Only run this if:**
   - You have credits in your account
   - You want to send a real communication
   - The recipient info is valid and correct

---

### Method 3: Using cURL (Command Line)

#### Test 1: Health Check
```bash
curl -X GET https://marketing.workfaraway.com/health
```

#### Test 2: Send Communication (Test Mode)
```bash
curl -X POST https://marketing.workfaraway.com/send \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cURL Test User",
    "phone_number": "(407) 555-1234",
    "email": "curl@test.com",
    "address": "123 cURL St, Orlando, FL",
    "channels": ["sms"],
    "company_name": "Test Company",
    "contact_phone": "(407) 555-9999",
    "city": "Orlando",
    "llm_provider": "openai",
    "llm_model": "gpt-4",
    "llm_temperature": 0.7,
    "voicemail_style": "professional",
    "test_mode": true
  }'
```

#### Test 3: Batch Send (Test Mode)
```bash
curl -X POST https://marketing.workfaraway.com/send/batch \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {
        "name": "User 1",
        "phone_number": "(407) 555-1111",
        "email": "user1@test.com",
        "address": "123 Test St"
      },
      {
        "name": "User 2",
        "phone_number": "(407) 555-2222",
        "email": "user2@test.com",
        "address": "456 Test Ave"
      }
    ],
    "channels": ["sms", "email"],
    "company_name": "Test Company",
    "contact_phone": "(407) 555-9999",
    "city": "Orlando",
    "test_mode": true
  }'
```

---

### Method 4: Using Browser DevTools

#### Manual API Call from Console

1. **Open the App**
   - Navigate to: `http://localhost:5173/marketing`

2. **Open DevTools Console** (F12)

3. **Run Test API Call**
   ```javascript
   // Test health check
   fetch('https://marketing.workfaraway.com/health')
     .then(res => res.json())
     .then(data => console.log('Health:', data))
     .catch(err => console.error('Error:', err));

   // Test send communication
   fetch('https://marketing.workfaraway.com/send', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'DevTools Test',
       phone_number: '(407) 555-1234',
       email: 'devtools@test.com',
       address: '123 DevTools St',
       channels: ['sms'],
       company_name: 'Test Co',
       contact_phone: '(407) 555-9999',
       city: 'Orlando',
       llm_provider: 'openai',
       llm_model: 'gpt-4',
       llm_temperature: 0.7,
       voicemail_style: 'professional',
       test_mode: true
     })
   })
     .then(res => res.json())
     .then(data => console.log('Send Result:', data))
     .catch(err => console.error('Error:', err));
   ```

---

## 🔍 Debugging API Issues

### Issue 1: Health Check Fails

**Symptoms:**
- App shows "API is unhealthy" message
- Console shows: "Health check failed: [error]"

**Causes:**
1. Backend is not running
2. Wrong API URL in settings
3. CORS issues
4. Network/firewall blocking request

**Solutions:**
```javascript
// Check current API URL
console.log('API URL:', 'https://marketing.workfaraway.com');

// Test manually
fetch('https://marketing.workfaraway.com/health')
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err));

// Fix: Update API URL in Settings
// Navigate to /marketing/settings
// Update "Marketing API URL"
```

### Issue 2: CORS Errors

**Symptoms:**
- Console shows: "Access to fetch... has been blocked by CORS policy"
- API call fails with network error

**Causes:**
- Backend not configured to allow requests from frontend domain

**Solution (Backend):**
```python
# Backend needs to add CORS headers
# Example for Flask:
from flask_cors import CORS
CORS(app, origins=['http://localhost:5173'])

# Example for FastAPI:
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173'],
    allow_methods=['*'],
    allow_headers=['*']
)
```

### Issue 3: Request Fails with 400/500 Error

**Symptoms:**
- API returns error status
- Toast shows "Failed to send communication"

**Debug Steps:**
```javascript
// 1. Check what was sent
// Open DevTools > Network tab
// Click on failed request
// View "Payload" tab to see request body

// 2. Check response
// View "Response" tab to see error message

// 3. Log full error
// In useMarketing.ts, add console.log:
catch (error: any) {
  console.error('Full error:', error);
  console.error('Response:', error.response?.data);
  toast.error(error.message || 'Failed to send communication');
  throw error;
}
```

### Issue 4: Test Mode Not Working

**Symptoms:**
- Test mode is ON but communications seem to send for real
- Or vice versa

**Debug:**
```javascript
// Check test mode value in store
// Open DevTools Console
console.log('Test Mode:',
  JSON.parse(localStorage.getItem('marketing-storage')).state.settings.defaults.test_mode
);

// Check payload being sent
// Add to useMarketing.ts before API call:
console.log('Sending payload:', payload);
console.log('Test mode?', payload.test_mode);
```

---

## 📊 Monitoring API Calls

### View All API Calls in DevTools

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Filter by XHR or Fetch**
4. **Perform actions in the app**
5. **Click on each request to see:**
   - Request URL
   - Request method
   - Request headers
   - Request payload
   - Response status
   - Response body
   - Timing information

### Using Redux DevTools (Alternative)

Since we use Zustand, we can enable logging:

```typescript
// In marketingStore.ts, add devtools middleware:
import { devtools } from 'zustand/middleware';

export const useMarketingStore = create<MarketingStore>()(
  devtools(
    persist(
      (set, get) => ({ ... }),
      { name: 'marketing-storage' }
    ),
    { name: 'MarketingStore' }
  )
);
```

Then install Redux DevTools extension to see all state changes.

---

## ✅ Testing Checklist

### Before Testing
- [ ] Backend API is running
- [ ] API URL is correct in Settings (`/marketing/settings`)
- [ ] Test mode is ON (orange indicator)
- [ ] DevTools Console is open (F12)

### Test Mode Tests
- [ ] Health check succeeds
- [ ] Single SMS send (test mode)
- [ ] Single Email send (test mode)
- [ ] Single Call send (test mode)
- [ ] Multi-channel send (test mode)
- [ ] Batch upload CSV (test mode)
- [ ] Check all appear in History with 🧪 badge
- [ ] Verify responses show `test_mode: true`

### Production Mode Tests (CAREFUL!)
- [ ] Toggle test mode OFF
- [ ] Confirmation dialog appears
- [ ] Send to YOUR OWN phone/email first
- [ ] Verify real SMS/Email/Call received
- [ ] Check History shows without 🧪 badge
- [ ] Verify credits were consumed
- [ ] Turn test mode back ON

### Error Handling Tests
- [ ] Send with invalid phone number
- [ ] Send with invalid email
- [ ] Send with no channels selected
- [ ] Send while backend is down
- [ ] Test rate limiting (send many rapidly)
- [ ] Test offline queue (disconnect internet, send, reconnect)

---

## 🎓 Example Test Scenarios

### Scenario 1: First Time Setup

```bash
# 1. Start app
npm run dev

# 2. Open browser to /marketing

# 3. Go to Settings
# - Update company name
# - Update contact phone
# - Verify API URL: https://marketing.workfaraway.com
# - Save

# 4. Test health check
# Open DevTools Console
# Look for: "Health check result: { status: 'healthy' }"

# 5. Send first test communication
# - New Communication
# - Enter your own phone/email
# - Select SMS only
# - Complete wizard
# - Send in test mode
# - Check History
```

### Scenario 2: Batch Campaign Test

```bash
# 1. Create test CSV with 3 recipients
# name,phone_number,email,address
# Test1,(407)555-0001,test1@example.com,123 St
# Test2,(407)555-0002,test2@example.com,456 Ave
# Test3,(407)555-0003,test3@example.com,789 Rd

# 2. Upload CSV in Step 1
# 3. Select all channels: SMS + Email + Call
# 4. Use default messages (AI-generated)
# 5. Send in test mode
# 6. Watch progress in console
# 7. Verify 3 entries in History
# 8. Check all show success status
```

### Scenario 3: Production Send (Real)

```bash
# ⚠️ WARNING: Will send real communications!

# 1. Ensure you have credits
# 2. Use YOUR OWN contact info for testing
# 3. Toggle test mode OFF
# 4. Fill in recipient: YOUR phone/email
# 5. Select ONE channel (SMS recommended)
# 6. Confirm production warning dialog
# 7. Send
# 8. CHECK YOUR PHONE for real SMS
# 9. Verify in History (no 🧪 badge)
# 10. Turn test mode back ON
```

---

## 🆘 Need Help?

### Backend Not Running?
Contact your backend developer or check backend logs.

### API Endpoints Don't Match?
Update the endpoints in `src/services/marketingService.ts`

### Different Response Format?
Update types in `src/types/marketing.types.ts`

### Want to Mock API for Development?
See `ADVANCED_IMPROVEMENTS.md` for API mocking suggestions.

---

## 📚 Related Documentation

- `INSTALLATION_COMPLETE.md` - Full setup guide
- `REVIEW_AND_CHANGES.md` - All changes applied
- `SYSTEM_STATUS.md` - Current system status
- `ADVANCED_IMPROVEMENTS.md` - Future enhancements

---

**Happy Testing! 🧪**

Remember: **Always start with TEST MODE ON** to avoid accidental real sends!
