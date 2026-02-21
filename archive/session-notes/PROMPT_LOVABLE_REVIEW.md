# 🔍 Code Review Request - Campaign System Improvements

## Context
Implementei melhorias no sistema de campanhas de marketing. Preciso de um code review focado em:
1. Validação das correções de bugs
2. Verificação de edge cases
3. Performance e segurança
4. Consistência com o resto do codebase

## 📦 Summary of Changes

### 1️⃣ BUG FIX: Campaign Send Error
**File:** `src/components/marketing/CampaignManager.tsx` (lines 373-423)

**Issue:** `TypeError: Cannot read properties of undefined (reading 'includes')`

**Root Cause:**
- Function `getAllPhones()` and `getAllEmails()` were calling `.filter()` on `prop.tags` which could be `null` or `undefined`
- Code: `(prop.tags || []).filter(...)` still failed when tags was not an array

**Fix Applied:**
```typescript
// BEFORE (unsafe):
const getAllPhones = (prop: CampaignProperty): string[] => {
  const prefPhones = (prop.tags || []).filter((t: string) => t.startsWith('pref_phone:')).map(...);
  return prefPhones.length > 0 ? prefPhones : [];
};

// AFTER (safe):
const getAllPhones = (prop: CampaignProperty): string[] => {
  const tags = Array.isArray(prop.tags) ? prop.tags : [];

  const prefPhones = tags
    .filter((t: string) => typeof t === 'string' && t.startsWith('pref_phone:'))
    .map((t: string) => t.replace('pref_phone:', ''));

  const manualPhones = tags
    .filter((t: string) => typeof t === 'string' && t.startsWith('manual_phone:'))
    .map((t: string) => t.replace('manual_phone:', ''));

  const allPhones = [...prefPhones, ...manualPhones];

  if (allPhones.length > 0) return allPhones;

  const phone = prop[selectedPhoneColumn] as string | undefined;
  return phone ? [phone] : [];
};
```

**Questions for Review:**
- ✅ Is `Array.isArray()` the most robust check for this use case?
- ✅ Should we add additional validation for `selectedPhoneColumn` existence?
- ⚠️ Is there a risk of performance issues with multiple `.filter()` calls on large tag arrays?

---

### 2️⃣ FEATURE: Display All Property Previews in Step 4
**File:** `src/components/marketing/CampaignManager.tsx` (lines 1589-1734)

**User Request:** "aqui deveria montar todos os templates de todos as propriedades selecionadas"

**Previous Behavior:**
- Carousel with navigation: "1 / 2" with left/right arrows
- Only showed one property preview at a time
- User had to click arrows to see each property

**New Behavior:**
```tsx
{selectedProps.map((property, index) => (
  <div key={property.id || index} className="border-2 border-gray-200 rounded-lg p-4">
    <div className="flex items-start justify-between mb-4">
      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
        {index + 1}
      </div>
      <h4 className="font-bold">{property.address}</h4>
    </div>

    {/* Render preview for EACH property based on channel */}
    {selectedChannel === 'sms' && (
      <div className="bg-gray-50 p-3 rounded">
        {renderTemplatePreview(property)}
      </div>
    )}

    {selectedChannel === 'email' && (
      <iframe
        srcDoc={renderTemplatePreview(property)}
        sandbox="allow-same-origin"
        style={{ height: '400px' }}
      />
    )}
  </div>
))}
```

**Removed:**
- `previewIndex` state
- `prevPreview()` and `nextPreview()` functions
- Navigation UI with arrows and counter

**Questions for Review:**
- ⚠️ **Performance Concern:** If user selects 50+ properties, this will render 50 iframe elements (for email) or 50 preview cards. Could this cause performance issues?
- ⚠️ **Iframe Sandbox:** Using `sandbox="allow-same-origin"`. Is this secure enough? Should we add more restrictions?
- ✅ **User Experience:** Is showing ALL previews at once better than pagination? (User requested this explicitly)
- 💡 **Suggestion:** Should we add virtualization (react-window) if property count > 20?

---

### 3️⃣ FEATURE: Show Contact Details in Step 2
**File:** `src/components/marketing/CampaignManager.tsx` (lines 1283-1330)

**User Request:** "Here can you show the phone number selected"

**Previous Behavior:**
- Only showed counts: "2 📞 0 📧"
- Contact details hidden in tooltips

**New Behavior:**
```tsx
<div className="space-y-1 text-sm">
  {phones.length > 0 && (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Phone className="w-3 h-3 flex-shrink-0" />
      <span className="truncate font-mono text-xs">
        {phones.slice(0, 2).join(', ')}
        {phones.length > 2 && ` +${phones.length - 2} more`}
      </span>
    </div>
  )}

  {emails.length > 0 && (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Mail className="w-3 h-3 flex-shrink-0" />
      <span className="truncate font-mono text-xs">
        {emails.slice(0, 1).join(', ')}
        {emails.length > 1 && ` +${emails.length - 1} more`}
      </span>
    </div>
  )}
</div>
```

**Questions for Review:**
- ✅ Is `truncate` class sufficient to prevent layout breaks with long phone numbers?
- ✅ Should we show 2 phones but only 1 email, or make it consistent?
- 💡 Could we add a tooltip on hover to show ALL contacts when there are 3+?

---

### 4️⃣ ENHANCEMENT: Skip Trace API Support for Manual Contacts
**File:** `supabase/functions/get-skip-trace-data/index.ts` (lines 124-162)

**Issue:** API didn't return manually added contacts (stored in tags as `manual_phone:` and `manual_email:`)

**Changes:**
```typescript
// Extract from tags
const tags = Array.isArray(property.tags) ? property.tags : [];

const preferredPhones = tags
  .filter((t: string) => typeof t === 'string' && t.startsWith('pref_phone:'))
  .map((t: string) => t.replace('pref_phone:', ''));

const manualPhones = tags
  .filter((t: string) => typeof t === 'string' && t.startsWith('manual_phone:'))
  .map((t: string) => t.replace('manual_phone:', ''));

// Return in response
return {
  ...property,
  skip_trace_summary: {
    // ... existing fields
    manual_phones: manualPhones,
    manual_emails: manualEmails,
    all_available_phones: [...preferredPhones, ...manualPhones],
    all_available_emails: [...preferredEmails, ...manualEmails],
  }
};
```

**Questions for Review:**
- ⚠️ **Tag Storage:** Is using tags array the best approach for storing contact preferences? Should this be in separate columns?
- ⚠️ **API Performance:** Multiple `.filter()` operations on tags for each property. Is this efficient for 100+ properties?
- ✅ **Data Structure:** Is the response structure clear and consistent?
- ⚠️ **Security:** Edge function has `verify_jwt = false`. Is this intentional? Should we add authentication?

---

### 5️⃣ NEW: Client Service for Skip Trace API
**File:** `src/services/marketingService.ts` (+113 lines)

**Added:**
```typescript
export interface SkipTracePropertyData {
  id: string;
  address: string;
  // ... all property columns
  skip_trace_summary: {
    total_phones: number;
    total_emails: number;
    total_manual_phones: number;
    total_manual_emails: number;
    phones: SkipTracePhone[];
    emails: SkipTraceEmail[];
    preferred_phones: string[];
    preferred_emails: string[];
    manual_phones: string[];
    manual_emails: string[];
    all_available_phones: string[];
    all_available_emails: string[];
    dnc_status: 'DNC' | 'Clear';
    deceased_status: 'Deceased' | 'Active';
  };
}

export const getSkipTracePhones = async (options?: {
  propertyId?: string;
  limit?: number;
  offset?: number;
  hasSkipTraceData?: boolean;
  search?: string;
}): Promise<SkipTraceResponse> => {
  // ... implementation
};
```

**Questions for Review:**
- ⚠️ **Duplicate Imports:** File has duplicate imports at top (lines 1-11). Need to clean up?
- ✅ **Type Safety:** Are the TypeScript interfaces comprehensive enough?
- ✅ **Error Handling:** Does the try-catch properly handle all failure modes?

---

## 🎯 Specific Review Requests

### High Priority:
1. **Bug Fix Validation:** Is the `Array.isArray()` check in `getAllPhones()` and `getAllEmails()` sufficient to prevent the crash? Are there other edge cases?

2. **Performance Review:** Rendering 50+ property previews with iframes in Step 4. Will this cause performance issues? Should we:
   - Add pagination?
   - Implement virtualization (react-window)?
   - Lazy load iframes?

3. **Security Review:**
   - Iframe sandbox permissions - are they appropriate?
   - Edge Function `verify_jwt = false` - should this be authenticated?

### Medium Priority:
4. **Code Duplication:** marketingService.ts has duplicate imports. Clean this up?

5. **Data Architecture:** Using `tags` array to store contact preferences. Is this the best approach or should we create dedicated columns?

6. **API Rate Limiting:** Should `get-skip-trace-data` Edge Function have rate limiting?

### Low Priority:
7. **UX Consistency:** Step 2 shows 2 phones but 1 email. Make consistent or keep as-is?

8. **Accessibility:** Email preview iframes - do they need ARIA labels?

---

## 🧪 Test Cases to Validate

Please verify these scenarios work correctly:

### Critical:
- [ ] Send campaign with property that has `tags: null` - should not crash
- [ ] Send campaign with property that has `tags: []` - should fall back to selectedPhoneColumn
- [ ] Send campaign with manual contacts - they should receive messages
- [ ] Preview step with 2+ properties - all should display simultaneously

### Important:
- [ ] API call with `propertyId` returns single property with skip trace data
- [ ] API call with `hasSkipTraceData=true` filters correctly
- [ ] Step 2 property list displays phone numbers correctly (not just counts)

### Edge Cases:
- [ ] Property with 10+ phones - display should truncate properly
- [ ] Email preview with malicious HTML - iframe sandbox should block
- [ ] 100 properties selected - check performance in Step 4

---

## 📝 Files Changed

```
src/components/marketing/CampaignManager.tsx
  - Lines 140-141: Removed previewIndex state
  - Lines 180-181: Removed navigation functions
  - Lines 373-423: Fixed getAllPhones() and getAllEmails()
  - Lines 1283-1330: Show contact details in Step 2
  - Lines 1589-1734: Render all property previews in Step 4

src/services/marketingService.ts
  - Lines 1-11: ⚠️ Duplicate imports (need cleanup)
  - Lines 12-119: New Skip Trace API types and functions
  - Line 322: Export getSkipTracePhones

supabase/functions/get-skip-trace-data/index.ts
  - Lines 124-162: Extract manual contacts from tags

supabase/config.toml
  - Added configuration for get-skip-trace-data function
```

---

## ✅ What Should Be Working

After these changes:
1. ✅ Campaign send should not crash with undefined tags
2. ✅ Manual contacts should be included in campaigns
3. ✅ Step 4 shows ALL selected property previews at once
4. ✅ Step 2 shows actual phone numbers/emails (not just counts)
5. ✅ API returns manual contacts in skip_trace_summary

---

## ❓ Questions for You

1. **Performance:** Are you concerned about rendering 50+ iframes in Step 4? Should I implement pagination or virtualization?

2. **Data Architecture:** Tags array for preferences - is this acceptable or should we refactor to dedicated columns?

3. **Security:** Edge function without JWT verification - intentional or oversight?

4. **User Experience:** Any feedback on showing all previews vs pagination?

Please review and let me know:
- ✅ What looks good
- ⚠️ What needs fixing
- 🚨 What's critical to address before deployment

Thank you! 🙏
