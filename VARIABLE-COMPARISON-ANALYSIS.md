# 🔍 Retell Variable Names - Inbound vs Outbound Comparison

## 📋 CURRENT STATE ANALYSIS

### **INBOUND Calls** (Edge Function: `retell-webhook-handler`)
**File:** `supabase/functions/retell-webhook-handler/index.ts:256-285`

```typescript
// ❌ USANDO NOMES ANTIGOS:
call_inbound: {
  dynamic_variables: {
    customer_name: getBestCustomerName(),
    property_address: propertyInfo.address || "Unknown",      // ❌ ANTIGO
    property_city: propertyInfo.city || "Unknown",            // ❌ ANTIGO
    property_state: propertyInfo.state || "Unknown",          // ❌ ANTIGO
    property_zip: propertyInfo.zip_code || "Unknown",         // ❌ ANTIGO
    estimated_value: String(propertyInfo.estimated_value || 0),
    cash_offer: String(propertyInfo.cash_offer_amount || 0),
    total_phones: String(skipTraceInfo?.skip_trace_summary?.total_phones || 0),
    total_emails: String(skipTraceInfo?.skip_trace_summary?.total_emails || 0),
    dnc_status: skipTraceInfo?.skip_trace_summary?.dnc_status || "Unknown",
    deceased_status: skipTraceInfo?.skip_trace_summary?.deceased_status || "Unknown"
  }
}
```

### **OUTBOUND Calls** (Agente Retell v18)
**Status:** ✅ JÁ ATUALIZADO para novos nomes

```typescript
// ✅ USANDO NOMES NOVOS:
dynamic_variables: {
  customer_name: owner_name,
  address: full_address,      // ✅ NOVO (não property_address)
  city: city,                 // ✅ NOVO (não property_city)
  state: state,               // ✅ NOVO (não property_state)
  zip: zip_code,              // ✅ NOVO (não property_zip)
  estimated_value: estimated_value,
  cash_offer: cash_offer_amount
}
```

---

## 🚨 PROBLEMA IDENTIFICADO

### ❌ **INCONSISTÊNCIA NAS VARIÁVEIS**

| Tipo | customer_name | address | city | state | zip |
|------|---------------|---------|------|-------|-----|
| **Outbound** | ✅ customer_name | ✅ address | ✅ city | ✅ state | ✅ zip |
| **Inbound** | ✅ customer_name | ❌ property_address | ❌ property_city | ❌ property_state | ❌ property_zip |

**Resultado:**
- **Outbound calls:** ✅ Funcionam com `{{address}}`, `{{city}}`, `{{state}}`, `{{zip}}`
- **Inbound calls:** ❌ Esperam `{{property_address}}`, `{{property_city}}`, `{{property_state}}`, `{{property_zip}}`

---

## 🔧 SOLUÇÃO NECESSÁRIA

### Opção 1: ✅ **RECOMENDADO** - Atualizar Edge Function (Consistência)

**Atualizar:** `supabase/functions/retell-webhook-handler/index.ts:256-285`

```typescript
// ANTES (linhas 256-285):
const retellResponse = propertyInfo ? {
  call_inbound: {
    dynamic_variables: {
      customer_name: getBestCustomerName(),
      property_address: propertyInfo.address || "Unknown",      // ❌
      property_city: propertyInfo.city || "Unknown",            // ❌
      property_state: propertyInfo.state || "Unknown",          // ❌
      property_zip: propertyInfo.zip_code || "Unknown",         // ❌
      estimated_value: String(propertyInfo.estimated_value || 0),
      cash_offer: String(propertyInfo.cash_offer_amount || 0),
      total_phones: String(skipTraceInfo?.skip_trace_summary?.total_phones || 0),
      total_emails: String(skipTraceInfo?.skip_trace_summary?.total_emails || 0),
      dnc_status: skipTraceInfo?.skip_trace_summary?.dnc_status || "Unknown",
      deceased_status: skipTraceInfo?.skip_trace_summary?.deceased_status || "Unknown"
    }
  }
} : // ...

// DEPOIS (CORRIGIDO):
const retellResponse = propertyInfo ? {
  call_inbound: {
    dynamic_variables: {
      customer_name: getBestCustomerName(),
      address: propertyInfo.address || "Unknown",               // ✅ NOVO
      city: propertyInfo.city || "Unknown",                     // ✅ NOVO
      state: propertyInfo.state || "Unknown",                   // ✅ NOVO
      zip: propertyInfo.zip_code || "Unknown",                  // ✅ NOVO
      estimated_value: String(propertyInfo.estimated_value || 0),
      cash_offer: String(propertyInfo.cash_offer_amount || 0),
      total_phones: String(skipTraceInfo?.skip_trace_summary?.total_phones || 0),
      total_emails: String(skipTraceInfo?.skip_trace_summary?.total_emails || 0),
      dnc_status: skipTraceInfo?.skip_trace_summary?.dnc_status || "Unknown",
      deceased_status: skipTraceInfo?.skip_trace_summary?.deceased_status || "Unknown"
    }
  }
} : {
  call_inbound: {
    dynamic_variables: {
      customer_name: "Unknown",
      address: "Not found",          // ✅ NOVO
      city: "",                      // ✅ NOVO
      state: "",                     // ✅ NOVO
      zip: "",                       // ✅ NOVO
      estimated_value: "0",
      cash_offer: "0"
    }
  }
};
```

### Opção 2: ❌ **NÃO RECOMENDADO** - Reverter Agente (Inconsistência)

Reverter agente Retell para usar nomes antigos:
- `{{property_address}}` instead of `{{address}}`
- `{{property_city}}` instead of `{{city}}`
- `{{property_state}}` instead of `{{state}}`
- `{{property_zip}}` instead of `{{zip}}`

**Por que não:** Nomes novos são mais limpos e consistentes.

---

## ✅ MUDANÇAS NECESSÁRIAS

### Arquivo: `supabase/functions/retell-webhook-handler/index.ts`

**Linhas a mudar:**

| Linha | ANTES | DEPOIS |
|-------|-------|--------|
| 260 | `property_address: propertyInfo.address` | `address: propertyInfo.address` |
| 261 | `property_city: propertyInfo.city` | `city: propertyInfo.city` |
| 262 | `property_state: propertyInfo.state` | `state: propertyInfo.state` |
| 263 | `property_zip: propertyInfo.zip_code` | `zip: propertyInfo.zip_code` |
| 277 | `property_address: "Not found"` | `address: "Not found"` |
| 278 | `property_city: ""` | `city: ""` |
| 279 | `property_state: ""` | `state: ""` |
| 280 | `property_zip: ""` | `zip: ""` |

---

## 🎯 EXPECTED BEHAVIOR AFTER FIX

### Outbound Call Example
```
Agent: Hi, is this IVERSON DELLA M?
User: Yes.
Agent: Great. My name is Maria, and we're local real estate investors
       in your area. I know this call is out of the blue, but I was calling
       to see if you would consider a cash offer on your property at
       1025 S WASHINGTON AVE, Orlando, FL 32801?
```

**Variables used:**
- `{{customer_name}}` → "IVERSON DELLA M"
- `{{address}}` → "1025 S WASHINGTON AVE"
- `{{city}}` → "Orlando"
- `{{state}}` → "FL"
- `{{zip}}` → "32801"

### Inbound Call Example
```
User: Hi, I'm calling about your offer.
Agent: Thank you for calling! Is this IVERSON DELLA M?
User: Yes.
Agent: Perfect! I see you're calling about the property at
       1025 S WASHINGTON AVE, Orlando, FL 32801.
       We have a cash offer of $99,576 for you. Would you like to
       discuss this further?
```

**Variables used (AFTER FIX):**
- `{{customer_name}}` → "IVERSON DELLA M"
- `{{address}}` → "1025 S WASHINGTON AVE"  ✅ (era property_address)
- `{{city}}` → "Orlando"  ✅ (era property_city)
- `{{state}}` → "FL"  ✅ (era property_state)
- `{{zip}}` → "32801"  ✅ (era property_zip)

---

## 📊 VARIABLE MAPPING TABLE

| Database Field | Old Variable Name | New Variable Name | Status |
|----------------|-------------------|-------------------|---------|
| `owner_name` | `customer_name` | `customer_name` | ✅ Same |
| `address` | `property_address` | `address` | ❌ NEEDS UPDATE |
| `city` | `property_city` | `city` | ❌ NEEDS UPDATE |
| `state` | `property_state` | `state` | ❌ NEEDS UPDATE |
| `zip_code` | `property_zip` | `zip` | ❌ NEEDS UPDATE |
| `estimated_value` | `estimated_value` | `estimated_value` | ✅ Same |
| `cash_offer_amount` | `cash_offer` | `cash_offer` | ✅ Same |

---

## 🚀 DEPLOYMENT STEPS

1. **Update Edge Function Code**
   - Edit `supabase/functions/retell-webhook-handler/index.ts`
   - Change lines 260-263 and 277-280
   - Replace `property_address/city/state/zip` with `address/city/state/zip`

2. **Deploy to Supabase**
   ```bash
   supabase functions deploy retell-webhook-handler
   ```

3. **Test Inbound Call**
   - Call Retell inbound number from a phone associated with a property
   - Verify agent uses correct address: "1025 S WASHINGTON AVE" (not "Unknown")
   - Verify agent uses correct city/state/zip

4. **Verify Both Call Types**
   - ✅ Outbound: Already working with new variables
   - ✅ Inbound: Will work after edge function update

---

## 🔍 VERIFICATION CHECKLIST

### Before Fix
- [ ] Outbound calls use `{{address}}` ✅ Working
- [ ] Inbound calls use `{{property_address}}` ❌ Not matching edge function

### After Fix
- [ ] Outbound calls use `{{address}}` ✅ Working
- [ ] Inbound calls use `{{address}}` ✅ Will work
- [ ] Both call types have consistent variable names ✅
- [ ] No more `property_` prefix on location variables ✅

---

**Status:** 🔴 NEEDS UPDATE
**Priority:** 🔥 HIGH (Inbound calls may not work properly)
**Impact:** Inbound callers won't hear their property address correctly
**Estimated Time:** 5 minutes to fix + deploy
