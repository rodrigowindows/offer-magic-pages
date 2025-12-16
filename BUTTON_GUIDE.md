# 🎯 Quick Button Reference Guide

## Property Action Buttons in Admin Table

Each property row now has these buttons (in order):

```
┌─────────────────────────────────────────────────────────────────┐
│  Property: 123 Main St, Orlando FL                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Offer Letter] [Edit] [🌐] [📋] [📱] [📝] [📷] [🏷️] [✓] [🏠] [📊]  │
│       1         2      3    4    5    6    7    8   9   10  11  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Original Buttons (Already Existed)

### 1. **[Offer Letter]** Button
- **Action:** Generate cash offer letter PDF
- **Opens:** CashOfferDialog
- **Purpose:** Create printable offer for property owner

### 2. **[Edit]** Button
- **Action:** Edit all property details
- **Opens:** Edit Property Dialog
- **Purpose:** Update address, prices, owner info, etc.

### 3. **🌐** Button (Globe Icon)
- **Action:** Open property landing page
- **Opens:** New tab with public property page
- **Purpose:** View how page looks to sellers

### 4. **📋** Button (Clipboard Icon)
- **Action:** Copy landing page URL
- **Opens:** Nothing (copies to clipboard)
- **Purpose:** Share link with others

### 5. **📱** Button (QR Code Icon)
- **Action:** Generate QR code for property
- **Opens:** QR Code Dialog
- **Purpose:** Print QR codes for marketing

### 6. **📝** Button (Notes Icon)
- **Action:** Add/view property notes
- **Opens:** Property Notes Dialog
- **Purpose:** Track communications and follow-ups

---

## NEW Buttons (Orlando Integration)

### 7. **📷** Button (Camera Icon) - NEW!
- **Action:** Upload property image
- **Opens:** PropertyImageUpload dialog
- **What it does:**
  - Select image from computer (max 5MB)
  - Preview before uploading
  - Uploads to Supabase Storage
  - Updates property_image_url field
  - Image appears in table thumbnail
- **Requirement:** "Upload de fotos / ver te colocar as fotos junto"

### 8. **🏷️** Button (Tag Icon) - NEW!
- **Action:** Manage property tags
- **Opens:** PropertyTagsManager dialog
- **What it does:**
  - Add custom tags
  - Choose from 14 suggested tags:
    - tier-1, tier-2, tier-3
    - hot-lead, deed-certified, vacant
    - pool-distress, high-equity
    - out-of-state, estate-trust
    - follow-up, contacted, interested, not-interested
  - Remove existing tags
  - Tags saved to database (text[] array)
- **Requirement:** "tags e filtros / Fazer filtro por tag lista"

### 9. **✓** Button (Checkmark Icon) - NEW!
- **Action:** Approve or reject property
- **Opens:** PropertyApprovalDialog
- **What it does:**
  - Click "Approve" → marks as approved
  - Click "Reject" → choose from 12 reasons:
    1. Casa muito boa (too good condition)
    2. Propriedade de LLC
    3. Propriedade comercial
    4. Duplicado
    5. Localização errada
    6. Sem equity suficiente
    7. Já foi contatado anteriormente
    8. Ocupado/Alugado (not distressed)
    9. Venda recente
    10. Restrições de HOA
    11. Problemas no título
    12. Outro motivo (custom)
  - Add notes (optional)
  - Tracks who approved/rejected + timestamp
  - Updates approval_status field
- **Requirement:** "aprovar e declinar / coloca razoes"

### 10. **🏠** Button (House Icon) - NEW!
- **Action:** Check Airbnb eligibility
- **Opens:** AirbnbEligibilityChecker dialog
- **What it does:**
  - Checks if property can be short-term rental
  - Database of 8 Florida cities:
    - ✅ Orlando (allowed, requires license)
    - ✅ Kissimmee (allowed)
    - ❌ Miami (not allowed, 180+ days)
    - ❌ Miami Beach (not allowed)
    - ❌ Fort Lauderdale (not allowed, 30+ days)
    - ✅ Jacksonville (allowed)
    - ✅ Tampa (allowed)
    - ✅ Cape Coral (allowed)
  - Shows regulations, license requirements, min nights
  - Saves airbnb_eligible status to database
  - Badge: "Não Verificado" / "Airbnb OK" / "Não Permitido"
- **Requirement:** "api que check se a propredade pode fazer airbnb"

### 11. **📊** Button (Chart Icon) - NEW! (Just Added Today)
- **Action:** AI-powered price comparison
- **Opens:** PropertyComparison dialog
- **What it does:**
  - Analyzes property value vs your offer
  - Calculates estimated value range (low/mid/high)
  - Determines market condition:
    - 🔥 MERCADO QUENTE (hot market)
    - 📊 MERCADO NORMAL (normal market)
    - ❄️ MERCADO FRIO (cold market)
  - Provides recommendation:
    - 🔴 <65% → "OFFER TOO LOW"
    - 🟢 65-75% → "GOOD OFFER"
    - 🟡 75-85% → "MODERATE OFFER"
    - ⚠️ >85% → "HIGH OFFER"
  - Shows full AI analysis text
  - **Auto-generates 3 Zillow URLs:**
    - Search URL (most reliable)
    - Direct URL (property page)
    - Map URL (neighborhood)
  - Saves to database:
    - comparative_price = mid estimate
    - zillow_url = search URL
    - evaluation = recommendation
  - **100% FREE - No paid API needed!**
- **Requirement:** "fazer comparativo / tem alguma api que ajuda / ver colocar o link do zillow"

---

## Filter Bar (Top of Properties Tab)

### Existing Filter:
- **Lead Status Filter** (New, Contacted, Qualified, etc.)

### NEW Filters:
1. **Approval Status Filter**
   - All / Pending / Approved / Rejected
   - Shows counts for each status
   - Colored badges (yellow/green/red)

2. **Tags Filter**
   - Multi-select checkboxes
   - Shows all unique tags in database
   - Active filters shown as badges (removable)
   - Example: "tier-1" + "hot-lead" = shows only properties with BOTH tags

3. **Advanced Filters Popover**
   - Click to open filter menu
   - 10+ filter options:
     - City (multi-select)
     - County (multi-select)
     - Property Type (multi-select)
     - Import Batch (multi-select)
     - Import Date Range (calendar picker)
     - Price Range (min/max sliders)
     - Bedrooms (minimum)
     - Bathrooms (minimum)
     - Airbnb Eligible (yes/no)
     - Has Image (yes/no)
   - Active filters shown as badges
   - All filters work together (AND logic)

---

## Usage Examples

### Scenario 1: Process New Import
```
1. Import 100 properties from Orlando tax list
2. Use 📷 to upload property images
3. Use 📊 to run AI analysis on each
   → Gets value range, Zillow URLs, recommendations
4. Use 🏷️ to tag hot leads (tier-1, hot-lead)
5. Use ✓ to reject bad ones
   → "Casa muito boa" for non-distressed
   → "LLC property" for commercial
6. Filter to show only "Approved" + "tier-1" tags
7. Start campaign on filtered list
```

### Scenario 2: Research Property
```
1. Click 📊 to run AI analysis
2. View estimated value range
3. Read market recommendation
4. Click Zillow links to:
   → Search for exact property
   → View comparable sales nearby
   → Check neighborhood map
5. Click 🏠 to check Airbnb eligibility
6. Add notes via 📝 with findings
7. Use ✓ to approve or reject
```

### Scenario 3: Filter and Export
```
1. Use filters to narrow down:
   → City: Orlando
   → Tags: tier-1 + hot-lead
   → Approval: Approved
   → Price: $200k-$400k
   → Has Image: Yes
2. Results: 23 properties
3. Select all (checkbox at top)
4. Use bulk actions:
   → Start campaign
   → Generate QR codes
   → Print offer letters
```

---

## Keyboard Shortcuts (Future Enhancement)

Could add these later:
- `I` = Upload Image (📷)
- `T` = Manage Tags (🏷️)
- `A` = Approve (✓)
- `R` = Reject (✓)
- `B` = Check Airbnb (🏠)
- `C` = AI Comparison (📊)
- `E` = Edit property
- `N` = Add Note (📝)

---

## Mobile View

On mobile, buttons stack or show as:
- Primary: [Offer] [Edit] [📊]
- Secondary: [🌐] [📋] [📱] [📝]
- Tertiary: [📷] [🏷️] [✓] [🏠]

Or use "..." menu to show all actions.

---

## Button Colors

- **Primary buttons** (blue): Offer Letter, Edit
- **Outline buttons** (gray): All icon buttons
- **Success** (green): ✓ when approved
- **Destructive** (red): ✓ when rejected

---

## Summary

| Button | Name | Purpose | When to Use |
|--------|------|---------|-------------|
| [Offer Letter] | Generate Offer | Create PDF offer | Ready to make offer |
| [Edit] | Edit Property | Update details | Need to fix data |
| 🌐 | View Page | See public page | Check landing page |
| 📋 | Copy Link | Copy URL | Share with team |
| 📱 | QR Code | Generate QR | Print marketing |
| 📝 | Notes | Add notes | Track communications |
| 📷 | Upload Image | Add photo | Property has no image |
| 🏷️ | Manage Tags | Organize | Categorize property |
| ✓ | Approve/Reject | Filter quality | Initial screening |
| 🏠 | Check Airbnb | STR eligible | Airbnb potential |
| 📊 | AI Compare | Price analysis | Need valuation + Zillow |

**Most Used Workflow:**
📊 (analysis) → 🏠 (Airbnb check) → 🏷️ (add tags) → ✓ (approve/reject) → 📷 (add photo)

Enjoy the new features! 🚀
