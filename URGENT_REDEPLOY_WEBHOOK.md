# 🚨 URGENT: Redeploy Webhook Handler

## Problem
The currently deployed webhook code is **OLD** and doesn't search for phone numbers correctly.

## Current Git Status
✅ Commit `cd897be` has the **CORRECT** code  
❌ Supabase has the **OLD** code deployed

## How to Fix

### Option 1: Deploy via Supabase Dashboard (Fastest)
1. Go to Supabase Dashboard → Edge Functions
2. Open `retell-webhook-handler`
3. **DELETE ALL CODE** in the editor
4. Copy the code from: `supabase/functions/retell-webhook-handler/index.ts` (this file in Git)
5. Click "Deploy"

### Option 2: Deploy via Supabase CLI
```powershell
# If you have Supabase CLI installed:
cd "g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
supabase functions deploy retell-webhook-handler
```

### Option 3: GitHub Actions (Need Secret Setup)
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add secret: `SUPABASE_ACCESS_TOKEN` (get from Supabase Dashboard → Settings → API)
3. Push any change to trigger deployment:
   ```powershell
   git commit --allow-empty -m "Trigger webhook redeploy"
   git push
   ```

## How to Verify Fix Works

Run this PowerShell test:
```powershell
cd "g:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
.\test-webhook.ps1
```

Expected output:
```
✅ Test 1: +14079283433 → property_found: True (144 WASHINGTON AVE EATONVILLE)
✅ Test 2: +12405814595 → property_found: False
```

## The Critical Code Difference

### ❌ OLD (Currently Deployed):
```typescript
.or([
  `owner_phone.eq.${fromNumber}`,  // Only searches +14079283433
  `phone1.eq.${fromNumber}`,
  // Missing searches for 4079283433 (without +1)
].join(','))
```

### ✅ NEW (In Git cd897be):
```typescript
.or(`owner_phone.eq.${fromNumber},phone1.eq.${fromNumber},phone2.eq.${fromNumber},phone3.eq.${fromNumber},phone4.eq.${fromNumber},phone5.eq.${fromNumber},owner_phone.eq.${cleanPhone},phone1.eq.${cleanPhone},phone2.eq.${cleanPhone},phone3.eq.${cleanPhone},phone4.eq.${cleanPhone},phone5.eq.${cleanPhone}`)
```

The fix searches **BOTH** formats:
- `${fromNumber}` = +14079283433 (with +1)
- `${cleanPhone}` = 4079283433 (without +1)

## Why This Matters
Retell AI sends phone numbers as `+14079283433` but our database stores them as `4079283433` (no +1 prefix). The webhook MUST search both formats or it won't find properties.
