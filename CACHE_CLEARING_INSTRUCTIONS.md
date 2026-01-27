# Cache Clearing Instructions

## When to Clear Cache

Clear the cache if you see these signs:
- ⚠️ Generic street names (Colonial Dr, Pine Ave, Oak St, Main St)
- ⚠️ Multiple properties showing 0.0mi distance
- ⚠️ "Demo Data" badge in PDFs
- ⚠️ Data quality warnings about generic addresses

## How to Clear Cache

### 1. Clear Browser Memory Cache
Open the browser console (F12) and run:
```javascript
// This clears the in-memory cache used by CompsAnalysis component
window.location.reload();
```

### 2. Clear LocalStorage
```javascript
// Clear all cached data
localStorage.clear();

// Or clear specific keys
localStorage.removeItem('mapbox_token');
```

### 3. Clear Supabase Database Cache

#### Option A: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Navigate to your project
3. Go to Table Editor → `comps_analysis_history`
4. Delete rows with `data_source = 'demo'` or old timestamps

#### Option B: Via SQL Query
```sql
-- Delete all demo data
DELETE FROM comps_analysis_history
WHERE data_source = 'demo';

-- Or delete all cached analyses older than 7 days
DELETE FROM comps_analysis_history
WHERE created_at < NOW() - INTERVAL '7 days';

-- Or delete all cached analyses for specific property
DELETE FROM comps_analysis_history
WHERE property_id = 'YOUR_PROPERTY_ID';
```

### 4. Force Fresh API Fetch

To bypass all caches and force a fresh API call:

1. Open `src/components/marketing/CompsAnalysis.tsx`
2. Temporarily comment out the cache checks:
```typescript
// Comment these sections:
// - Line ~740: Memory cache check (if (cached) {...})
// - Line ~770: Database cache check (if (historyData) {...})
```
3. Generate analysis
4. Uncomment the sections

## API Key Configuration

To avoid demo data, configure these API keys in `.env`:

```bash
# Attom Data API (RECOMMENDED - 1000 requests/month FREE)
VITE_ATTOM_API_KEY="your_attom_api_key"

# RapidAPI for Zillow (BACKUP - 500 requests/month FREE)
VITE_RAPID_API_KEY="your_rapidapi_key"
```

### Get Free API Keys:
1. **Attom Data**: https://api.developer.attomdata.com/signup
2. **RapidAPI**: https://rapidapi.com/apimaker/api/zillow-com1/pricing

## Data Source Indicators

The system now shows data source in PDFs:

| Badge | Source | Description |
|-------|--------|-------------|
| 🟢 MLS Data | attom | Real MLS data from Attom API |
| 🔵 Zillow API | zillow | Real data from Zillow via RapidAPI |
| 🟠 Public Records | county-csv | Orange County public records |
| ⚪ Demo Data | demo | ⚠️ Demo/test data (not real) |
| 🟣 Database Cache | database | Previously fetched data |

## Validation Warnings

The PDF export now includes automatic validation:

### Price Validation
- Checks if avg comp price differs significantly from base price (±50%)
- Validates $/sqft is in normal Orlando range ($30-$150)

### Data Quality
- Detects generic street names (>30% generic = warning)
- Detects missing geocoding (>50% with 0.0mi distance = warning)

### Quantity Check
- Warns if fewer than 3 comparables found

## Technical Details

### Cache Hierarchy (in order of priority):
1. **Memory Cache** (`compsCache` state) - Fastest, cleared on page reload
2. **Current Selection** (`filteredComps` state) - If user already has analysis loaded
3. **Database Cache** (`comps_analysis_history` table) - Persists across sessions
4. **API Fetch** (`fetch-comps` edge function) - Fresh data from external APIs

### Data Source Detection:
```typescript
// Priority order:
1. savedAnalysis.data_source (from database field)
2. comparables[0].source (from individual comp)
3. analysis.dataSource (from analysis object)
4. 'database' (default fallback)
```

## Recent Changes (2026-01-26)

✅ Fixed table width overflow (127mm total)
✅ Improved cache source detection (checks comps[0].source)
✅ Added demo data pattern detection (generic streets)
✅ Badge always appears (defaults to "Database Cache")
✅ Added distance validation (detects 0.0mi issues)

## Support

If you continue seeing demo data after clearing cache and configuring API keys:
1. Check browser console for API errors
2. Verify API keys in `.env` file
3. Check Supabase Edge Function logs
4. Review `comps_analysis_history` table for old data
