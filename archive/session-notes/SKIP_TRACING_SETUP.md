# Skip Tracing Importer - Setup Instructions

## ✅ Component Created

File: `src/components/SkipTracingImporter.tsx`

## 🎯 What It Does

Automatically updates property records with skip tracing data from PropStream/BatchSkipTracing exports:

### Features:
- ✅ **Fuzzy address matching** - Finds properties even with slight address variations
- ✅ **Smart phone selection** - Prioritizes Mobile > Residential > Other
- ✅ **Multi-phone support** - Saves all 7 phones in JSON metadata
- ✅ **Relative tracking** - Stores up to 5 relatives with their phones
- ✅ **DNC flagging** - Auto-tags properties flagged as DNC/Litigator
- ✅ **Deceased detection** - Records deceased status
- ✅ **Email extraction** - Primary + secondary emails
- ✅ **Age tracking** - Records owner age
- ✅ **Safe updates** - Won't overwrite existing owner data

## 📋 How to Add to Admin Panel

### Option 1: Add to Dashboard Tab

In `src/pages/Admin.tsx`, add near line 1153 (next to AIPropertyImport):

\`\`\`tsx
import { SkipTracingImporter } from "@/components/SkipTracingImporter";

// In the Dashboard tab, add:
<SkipTracingImporter />
\`\`\`

### Option 2: Add to Properties Tab

Add in the properties list section:

\`\`\`tsx
<div className="mb-4">
  <SkipTracingImporter />
</div>
\`\`\`

### Option 3: Add as Dialog

Add to the HeaderActionsMenu dropdown or create a new dialog trigger.

## 🗄️ Database Requirements

### Required Field

The importer stores data in a JSONB field called `skip_tracing_data`.

**If it doesn't exist**, run this SQL in Supabase:

\`\`\`sql
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS skip_tracing_data JSONB;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_skip_tracing
ON properties USING GIN (skip_tracing_data);
\`\`\`

### Skip Tracing Data Structure

\`\`\`json
{
  "firstName": "John",
  "lastName": "Doe",
  "age": 45,
  "isDNC": false,
  "isDeceased": false,
  "phones": [
    { "number": "4075551234", "type": "Mobile" },
    { "number": "4075555678", "type": "Residential" }
  ],
  "emails": [
    "john@example.com",
    "johndoe@gmail.com"
  ],
  "relatives": [
    {
      "name": "Jane Doe",
      "age": 42,
      "phones": [
        { "number": "4075559999", "type": "Mobile" }
      ]
    }
  ],
  "updatedAt": "2025-01-04T10:30:00Z"
}
\`\`\`

## 📊 CSV Format Expected

The component expects PropStream/BatchSkipTracing export format with these columns:

### Required Columns:
- `Input Property Address`
- `Input Property City`
- `Input Property State`
- `Input Property Zip`
- `Matched First Name`
- `Matched Last Name`

### Optional Data Columns:
- `DNC/Litigator Scrub` (Yes/No/DNC)
- `Deceased` (Y/N)
- `Age`
- `Phone1` through `Phone7`
- `Phone1 Type` through `Phone7 Type`
- `Email1`, `Email2`
- `Relative1 Name` through `Relative5 Name`
- `Relative1 Age` through `Relative5 Age`
- `Relative1 Phone1` through `Relative5 Phone5`

## 🚀 Usage

1. **Upload CSV** - Select your skip tracing export file
2. **Click Import** - Process runs automatically
3. **View Results** - See matched, updated, skipped, errors
4. **Check Details** - Expand to see line-by-line results

## 📈 Import Results

The importer shows:
- **Total**: Total rows in CSV
- **Matched**: Properties found in database
- **Updated**: Successfully updated records
- **Skipped**: No match found or empty address
- **Errors**: Failed updates

## 🔍 Matching Logic

1. Search by address (case-insensitive, fuzzy)
2. Filter by city (case-insensitive)
3. Filter by state (exact match)
4. If multiple matches, prefer exact address
5. Fall back to first match if ambiguous

## ⚠️ Important Notes

- **Won't overwrite** existing owner_name, owner_phone, owner_email unless they're empty
- **Always saves** all data to skip_tracing_data JSON field
- **DNC tag** is added if flagged, won't remove existing tags
- **Address matching** is fuzzy to handle variations
- **Performance**: Processes ~50-100 records per minute

## 🔧 Troubleshooting

### No matches found
- Check address format matches database
- Verify city and state are correct
- Try with fewer properties first

### Errors during import
- Check Supabase RLS policies allow updates
- Verify user has permission to update properties
- Check browser console for detailed errors

### Field not found
- Run the SQL migration to add skip_tracing_data column
- Refresh Supabase types if using TypeScript

## 📞 Data Access

After import, access skip tracing data in queries:

\`\`\`tsx
const { data } = await supabase
  .from('properties')
  .select('*, skip_tracing_data')
  .eq('id', propertyId);

const phones = data?.skip_tracing_data?.phones || [];
const relatives = data?.skip_tracing_data?.relatives || [];
\`\`\`

## 🎨 UI Components Used

- Card (shadcn/ui)
- Button (shadcn/ui)
- Input (shadcn/ui)
- Badge (shadcn/ui)
- Alert (shadcn/ui)
- Papa Parse (CSV parsing)

## ✨ Future Enhancements

Potential improvements:
- [ ] Preview before import
- [ ] Selective field updates
- [ ] Batch processing with progress bar
- [ ] Export updated properties
- [ ] Undo last import
- [ ] Multiple phone number fields in UI
- [ ] Relatives contact list
