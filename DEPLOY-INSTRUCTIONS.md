# 🚀 Deployment Instructions - Retell Variable Fix

## ✅ COMPLETED

1. ✅ Updated `retell-webhook-handler` edge function
2. ✅ Changed variable names: `property_address` → `address`, etc.
3. ✅ Committed and pushed to GitHub

---

## 🔴 REQUIRED: Deploy Edge Function

### **CRITICAL:** You must deploy the updated edge function to Supabase

```bash
supabase functions deploy retell-webhook-handler
```

**Why this is needed:**
- Code changes are in GitHub ✅
- But Supabase is running the OLD deployed version ❌
- Inbound calls won't work correctly until deployed

---

## 📋 DEPLOYMENT CHECKLIST

### 1. Deploy Edge Function
```bash
cd "G:\My Drive\Sell House - code\Orlando\Step 5 - Outreach & Campaigns"
supabase functions deploy retell-webhook-handler
```

**Expected output:**
```
Deploying function retell-webhook-handler...
✓ Function retell-webhook-handler deployed successfully
```

### 2. Test Inbound Call

**Before Fix:**
```json
{
  "call_inbound": {
    "dynamic_variables": {
      "customer_name": "IVERSON DELLA M",
      "property_address": "1025 S WASHINGTON AVE",  ❌ Old variable
      "property_city": "Orlando",                   ❌ Old variable
      "property_state": "FL",                       ❌ Old variable
      "property_zip": "32801"                       ❌ Old variable
    }
  }
}
```

**After Fix:**
```json
{
  "call_inbound": {
    "dynamic_variables": {
      "customer_name": "IVERSON DELLA M",
      "address": "1025 S WASHINGTON AVE",  ✅ New variable
      "city": "Orlando",                   ✅ New variable
      "state": "FL",                       ✅ New variable
      "zip": "32801"                       ✅ New variable
    }
  }
}
```

### 3. Verify Both Call Types

#### Test Outbound Call
- Agent should say: "property at 1025 S WASHINGTON AVE, Orlando, FL 32801"
- Using variables: `{{address}}`, `{{city}}`, `{{state}}`, `{{zip}}`
- **Status:** ✅ Already working (agent v18 updated)

#### Test Inbound Call
- Call Retell number from phone associated with a property
- Agent should recognize caller and say property address
- Using variables: `{{address}}`, `{{city}}`, `{{state}}`, `{{zip}}`
- **Status:** ⏳ Will work after edge function deployed

---

## 🔍 VERIFICATION

### Check Edge Function Logs
After deployment, test an inbound call and check Supabase logs:

```
✅ v3.0 RETELL FORMAT - Received webhook: call_started
✅ Property found: 1025 S WASHINGTON AVE - IVERSON DELLA M
✅ Returning Retell format: {
  "call_inbound": {
    "dynamic_variables": {
      "address": "1025 S WASHINGTON AVE",  ✅ NEW FORMAT
      "city": "Orlando",
      ...
    }
  }
}
```

### Variables Comparison

| Variable | Old Name | New Name | Status |
|----------|----------|----------|--------|
| Address | `property_address` | `address` | ✅ Updated |
| City | `property_city` | `city` | ✅ Updated |
| State | `property_state` | `state` | ✅ Updated |
| ZIP | `property_zip` | `zip` | ✅ Updated |
| Name | `customer_name` | `customer_name` | ✅ Same |
| Value | `estimated_value` | `estimated_value` | ✅ Same |
| Offer | `cash_offer` | `cash_offer` | ✅ Same |

---

## 📊 WHAT WAS FIXED

### Problem
```
Outbound agent (v18): Uses {{address}}, {{city}}, {{state}}, {{zip}}
Inbound webhook:      Sends property_address, property_city, etc.
                      ❌ MISMATCH!
```

### Solution
```
Outbound agent (v18): Uses {{address}}, {{city}}, {{state}}, {{zip}}
Inbound webhook:      Sends address, city, state, zip
                      ✅ MATCH!
```

### Files Changed
1. `supabase/functions/retell-webhook-handler/index.ts` - Updated variable names
2. `VARIABLE-COMPARISON-ANALYSIS.md` - Complete analysis document
3. Commit: `8179d29` - "fix: Standardize Retell variable names..."

---

## ⚠️ IMPORTANT NOTES

1. **Outbound calls work NOW** - Agent v18 already uses new variables
2. **Inbound calls need deploy** - Edge function must be deployed
3. **No code changes needed in Retell dashboard** - Agent already correct
4. **Test both call types after deploy** - Verify everything works

---

## 🎯 SUCCESS CRITERIA

After deployment, you should see:

✅ Outbound calls reference property address correctly
✅ Inbound calls recognize caller and property
✅ Both use same variable names (`{{address}}` not `{{property_address}}`)
✅ Supabase logs show new format with `address`, `city`, `state`, `zip`
✅ No "Unknown" or "Not found" in property references

---

**Next Step:** Run `supabase functions deploy retell-webhook-handler` 🚀
