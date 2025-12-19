# Reject Button Not Working - Diagnostic Guide

## Problem
When clicking the "Reject" button in Step 5, the rejection data is not being saved.

## Root Causes (Check in Order)

### 1. **Database Migration Not Applied** ⭐ Most Likely
The rejection columns might not exist in your Supabase database yet.

**Fix:**
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project
3. Click "SQL Editor" in left sidebar
4. Run this SQL to check if columns exist:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'properties'
   AND column_name IN ('approval_status', 'rejection_reason', 'rejection_notes');
   ```

5. If it returns 0 rows, run the migration:
   ```sql
   -- Add approval/rejection system columns
   ALTER TABLE properties
   ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
   ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
   ADD COLUMN IF NOT EXISTS approved_by_name text,
   ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
   ADD COLUMN IF NOT EXISTS rejection_reason text,
   ADD COLUMN IF NOT EXISTS rejection_notes text;

   -- Create index
   CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON properties(approval_status);
   ```

---

### 2. **User Not Authenticated**
The code requires `userId` and `userName` to save rejection data.

**Fix:**
1. Open browser console (F12)
2. Click reject button
3. Check for error: "Usuário não autenticado"
4. If you see this, you need to log in first
5. Check if there's a login/auth system in the app

---

### 3. **Supabase RLS (Row Level Security) Blocking Updates**
Supabase might be blocking the update due to security policies.

**Fix:**
1. Go to Supabase Dashboard
2. Click "Authentication" → "Policies"
3. Find the `properties` table
4. Make sure there's a policy allowing UPDATE for authenticated users:
   ```sql
   -- Check current policies
   SELECT * FROM pg_policies WHERE tablename = 'properties';

   -- If missing, create update policy
   CREATE POLICY "Allow authenticated users to update properties"
   ON properties
   FOR UPDATE
   TO authenticated
   USING (true)
   WITH CHECK (true);
   ```

---

### 4. **Console Errors**
JavaScript errors might be preventing the button from working.

**Fix:**
1. Open browser Developer Tools (F12)
2. Go to "Console" tab
3. Click the Reject button
4. Look for red errors
5. Common errors:
   - `supabase is not defined` → Check Supabase client setup
   - `Cannot read property 'from' of undefined` → Supabase not initialized
   - Network errors → Check internet connection

---

### 5. **Button Click Not Triggering**
The dialog might not be opening or the button isn't wired correctly.

**Fix - Add Debug Logging:**

Edit: `src/components/PropertyApprovalDialog.tsx`

Add console.log to the `handleReject` function (line 116):

```typescript
const handleReject = async () => {
  console.log("🔴 REJECT BUTTON CLICKED");  // ADD THIS
  console.log("User ID:", userId);           // ADD THIS
  console.log("Selected Reason:", selectedReason); // ADD THIS

  if (!userId || !userName) {
    toast({
      title: "Erro",
      description: "Usuário não autenticado",
      variant: "destructive",
    });
    return;
  }
  // ... rest of function
```

Then click reject and check the browser console for these logs.

---

## Quick Test

**Test if the reject function works at all:**

1. Open browser console (F12)
2. Paste this test code:
   ```javascript
   // Test Supabase connection
   console.log("Supabase client:", window.supabase);

   // Test if properties table is accessible
   supabase.from('properties').select('id, approval_status').limit(1).then(
     result => console.log("✅ Supabase working:", result)
   );
   ```

3. If you see errors, Supabase isn't configured correctly

---

## Most Likely Solution

Based on the code review, the **#1 most likely issue** is that the database columns don't exist yet.

**Quick Fix:**
1. Go to Supabase SQL Editor
2. Run this single command:
   ```sql
   ALTER TABLE properties
   ADD COLUMN IF NOT EXISTS rejection_reason text,
   ADD COLUMN IF NOT EXISTS rejection_notes text,
   ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';
   ```

3. Refresh your app
4. Try reject button again

---

## Verification

After applying the fix, verify it works:

1. Click reject button
2. Select a reason
3. Add notes (optional)
4. Click "Confirmar Rejeição"
5. Check Supabase Dashboard → Table Editor → `properties` table
6. Find the property row
7. Check columns: `approval_status`, `rejection_reason`, `rejection_notes`
8. They should have values!

---

## Still Not Working?

If none of the above fixes work, check:

1. **Network tab** (F12 → Network) - Look for failed API calls to Supabase
2. **Supabase project URL** - Make sure it's correct in your env file
3. **Supabase anon key** - Make sure it's correct
4. **Table name** - Verify the table is actually called `properties` (not `property` or something else)

---

## Code Location Reference

- **Reject Button Component:** `src/components/PropertyApprovalDialog.tsx` (line 248-255)
- **Reject Handler:** `src/components/PropertyApprovalDialog.tsx` (line 116-173)
- **Database Migration:** `supabase/migrations/20251216000001_add_approval_and_user_tracking.sql`
- **Rejection Reasons:** Lines 37-50 in PropertyApprovalDialog.tsx

---

## Expected Behavior

When working correctly:
1. Click property badge → Dialog opens
2. Click "Rejeitar" button → Form appears
3. Select rejection reason from dropdown
4. (Optional) Add notes
5. Click "Confirmar Rejeição"
6. Toast notification: "❌ Propriedade Rejeitada"
7. Badge updates to red "Rejeitado"
8. Data saved to database

---

**Need more help?** Check browser console for error messages and compare with the fixes above.
