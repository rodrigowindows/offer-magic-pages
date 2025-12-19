# 📥 Import CSV Data & Images to Lovable/Supabase

Complete guide to upload your 15,070 properties and 984 images without losing existing data.

---

## 🎯 Overview

You have:
- **15,070 properties** in `RESULTS/01_MASTER_Combined_Tax_Visual_Analysis.csv`
- **984 property images** in `Step 3 - Download Images/property_photos/`
- **Existing data** in Lovable with user approvals/rejections

Goal: Merge everything without losing approvals, rejections, or user tracking.

---

## ✅ Strategy: UPSERT (Update or Insert)

We'll use **UPSERT** logic:
- If property exists (same `account_number`): **UPDATE** only empty fields (preserve approvals)
- If property is new: **INSERT** with default `pending` status

This ensures:
- ✅ Existing approvals/rejections are preserved
- ✅ New properties are added
- ✅ Missing data is filled in

---

## 📋 Step-by-Step Process

### **Step 1: Upload Images to Supabase Storage**

Lovable uses Supabase Storage for images.

#### 1.1 Create Storage Bucket (One-time setup)

In Supabase Dashboard:
1. Go to **Storage** → Click **Create Bucket**
2. Name: `property-photos`
3. Set to **Public** (so images display on frontend)
4. Click **Create**

#### 1.2 Upload Images via Script

Create `tools/upload_images_to_supabase.py`:

```python
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Get from Supabase Dashboard → Settings → API
SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g., https://xxx.supabase.co
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

BUCKET_NAME = "property-photos"
PHOTOS_DIR = "../Step 3 - Download Images/property_photos"

def upload_image(file_path: Path):
    """Upload single image to Supabase Storage"""
    account_number = file_path.stem  # e.g., "23-22-28-7975-00330"

    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{account_number}.jpg"

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "image/jpeg"
    }

    with open(file_path, "rb") as f:
        response = requests.post(url, headers=headers, data=f)

    if response.status_code in [200, 201]:
        print(f"✅ Uploaded: {account_number}.jpg")
        return True
    else:
        print(f"❌ Failed: {account_number}.jpg - {response.text}")
        return False

def main():
    photos_path = Path(PHOTOS_DIR)
    images = list(photos_path.glob("*.jpg"))

    print(f"📸 Found {len(images)} images to upload")

    success = 0
    for img_path in images:
        if upload_image(img_path):
            success += 1

    print(f"\n✅ Uploaded {success}/{len(images)} images")

if __name__ == "__main__":
    main()
```

#### 1.3 Create `.env` file

Create `.env` in `tools/` folder:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from:
- Supabase Dashboard → **Settings** → **API**

#### 1.4 Run Upload

```bash
cd "Step 5 - Outreach & Campaigns/tools"
pip install requests python-dotenv
python upload_images_to_supabase.py
```

This uploads all 984 images. Images will be accessible at:
```
https://your-project.supabase.co/storage/v1/object/public/property-photos/23-22-28-7975-00330.jpg
```

---

### **Step 2: Import CSV Data Without Losing Existing Records**

#### 2.1 Create Import Script

Create `tools/import_csv_to_supabase.py`:

```python
import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service key for admin access

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

CSV_PATH = "../../RESULTS/01_MASTER_Combined_Tax_Visual_Analysis.csv"

def import_properties():
    """Import CSV data with UPSERT logic"""

    # Read CSV
    df = pd.read_csv(CSV_PATH)

    print(f"📊 Loaded {len(df)} properties from CSV")

    # Build image URL for each property
    def get_image_url(account_number):
        if pd.isna(account_number):
            return None
        return f"{SUPABASE_URL}/storage/v1/object/public/property-photos/{account_number}.jpg"

    success = 0
    skipped = 0
    errors = 0

    for idx, row in df.iterrows():
        account_number = row.get("Account_Number")

        if pd.isna(account_number):
            skipped += 1
            continue

        # Check if property already exists
        existing = supabase.table("properties").select("*").eq("account_number", account_number).execute()

        # Prepare data
        property_data = {
            "account_number": account_number,
            "property_address": row.get("Property_Address"),
            "owner_name": row.get("Owner_Name"),
            "mailing_address": row.get("Mailing_Address"),
            "property_use": row.get("DOR_UC"),

            # Financial
            "total_market_value": float(row.get("Total_Market_Value", 0)),
            "total_assessed_value": float(row.get("Total_Assessed_Value", 0)),
            "exemptions": float(row.get("Exemptions", 0)),
            "taxable_value": float(row.get("Taxable_Value", 0)),

            # Tax Analysis
            "years_delinquent": int(row.get("Years_Delinquent", 0)),
            "total_amount_due": float(row.get("Total_Amount_Due", 0)),
            "face_amount": float(row.get("Face_Amount", 0)),
            "certificate_count": int(row.get("Certificate_Count", 0)),

            # Scores
            "tax_score": float(row.get("Tax_Score", 0)),
            "visual_score": float(row.get("Visual_Score", 0)),
            "final_combined_score": float(row.get("Final_Combined_Score", 0)),
            "tier": row.get("Tier"),

            # Image
            "photo_url": get_image_url(account_number),

            # Default status for new properties
            "lead_status": "new",
            "approval_status": "pending",
        }

        try:
            if existing.data and len(existing.data) > 0:
                # Property exists - UPDATE only if fields are empty
                existing_prop = existing.data[0]

                # Only update fields that are empty/null in existing record
                update_data = {}
                for key, value in property_data.items():
                    if key not in ["approval_status", "approved_by", "approved_by_name",
                                   "approved_at", "rejection_reason", "rejection_notes"]:
                        # Skip approval fields - never overwrite
                        if existing_prop.get(key) is None or existing_prop.get(key) == "":
                            update_data[key] = value

                if update_data:
                    supabase.table("properties").update(update_data).eq("id", existing_prop["id"]).execute()
                    print(f"🔄 Updated: {account_number}")
                else:
                    print(f"⏭️  Skipped (no changes): {account_number}")

                success += 1
            else:
                # New property - INSERT
                supabase.table("properties").insert(property_data).execute()
                print(f"✅ Inserted: {account_number}")
                success += 1

        except Exception as e:
            print(f"❌ Error with {account_number}: {e}")
            errors += 1

    print(f"\n✅ Success: {success}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"❌ Errors: {errors}")

if __name__ == "__main__":
    import_properties()
```

#### 2.2 Update `.env` with Service Key

Add to `.env`:

```bash
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

⚠️ **Important**: Use **Service Role Key** (not anon key) for admin access.

Get from: Supabase Dashboard → **Settings** → **API** → **Service Role Key**

#### 2.3 Install Dependencies

```bash
pip install supabase pandas python-dotenv
```

#### 2.4 Run Import

```bash
python import_csv_to_supabase.py
```

This will:
- Insert new properties with `pending` status
- Update existing properties ONLY for empty fields
- **Preserve all approvals, rejections, and user tracking**

---

### **Step 3: Verify Import**

#### 3.1 Check in Supabase Dashboard

1. Go to Supabase Dashboard → **Table Editor** → `properties`
2. Look for your imported properties
3. Check that approvals/rejections are preserved

#### 3.2 Check in Lovable App

1. Deploy your Lovable app (migrations will auto-run)
2. Go to Admin page
3. Filter by approval status to see preserved data
4. Check that images display correctly

---

## 🔧 Troubleshooting

### Images not displaying?

Check Storage bucket is **Public**:
1. Supabase → **Storage** → `property-photos`
2. Click **Settings** → Set **Public** = ON

### Import script errors?

- Check `.env` has correct keys
- Use **Service Role Key** (not anon key)
- Check CSV column names match script

### Duplicate properties?

The script handles this automatically:
- Same `account_number` = UPDATE (not duplicate)
- Different `account_number` = INSERT new

---

## 📊 Expected Results

After import:
- **15,070 properties** in database
- **984 images** in Storage
- **All existing approvals/rejections preserved**
- **New properties** have `pending` status
- **Images linked** via `photo_url` field

---

## 🚀 Next Steps

After import:

1. **Deploy migrations** (auto-runs on Lovable deploy)
2. **Test filtering** (by user, by approval status)
3. **Review images** (check they display)
4. **Start reviewing** pending properties with team

---

## ❓ FAQ

**Q: Will this overwrite my existing approvals?**
A: No. The script specifically excludes approval fields from updates.

**Q: What if I run import twice?**
A: Safe. It will just update empty fields, not create duplicates.

**Q: Can I import in batches?**
A: Yes. Filter CSV first, then run script on smaller file.

**Q: How to delete all and re-import?**
A: In Supabase → Table Editor → Delete all rows. Then re-run script.

---

## 📁 Files Created

```
tools/
├── upload_images_to_supabase.py   # Upload 984 images
├── import_csv_to_supabase.py      # Import 15,070 properties
└── .env                            # API keys (add to .gitignore!)
```

---

**Questions?** See main [README.md](../README.md) or check Supabase docs.
