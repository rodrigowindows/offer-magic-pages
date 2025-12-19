"""
Import CSV data to Supabase with UPSERT logic

Imports all properties from Step 4 results WITHOUT overwriting existing approvals/rejections.
- Existing properties: UPDATE only empty fields
- New properties: INSERT with 'pending' status
"""

import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service key for admin access

CSV_PATH = "../../Step 4 - AI Review & Evaluate/RESULTS/01_MASTER_Combined_Tax_Visual_Analysis.csv"

def get_image_url(account_number):
    """Generate Supabase Storage URL for property image"""
    if pd.isna(account_number):
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/property-photos/{account_number}.jpg"

def clean_value(value):
    """Clean pandas values for Supabase"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value) if value != float('inf') else None
    return str(value)

def import_properties():
    """Import CSV data with UPSERT logic"""

    # Validate environment
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        print("\nCreate a .env file with:")
        print("SUPABASE_URL=https://your-project.supabase.co")
        print("SUPABASE_SERVICE_KEY=your-service-role-key-here")
        print("\n⚠️  Use SERVICE ROLE KEY (not anon key) for admin access")
        return

    # Read CSV
    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: CSV not found: {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)
    print(f"📊 Loaded {len(df)} properties from CSV")

    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    success = 0
    updated = 0
    inserted = 0
    skipped = 0
    errors = 0

    for idx, row in df.iterrows():
        account_number = row.get("Account_Number")

        if pd.isna(account_number):
            skipped += 1
            continue

        try:
            # Check if property already exists
            existing = supabase.table("properties").select("*").eq("account_number", account_number).execute()

            # Prepare data
            property_data = {
                "account_number": clean_value(account_number),
                "property_address": clean_value(row.get("Property_Address")),
                "owner_name": clean_value(row.get("Owner_Name")),
                "mailing_address": clean_value(row.get("Mailing_Address")),
                "property_use": clean_value(row.get("DOR_UC")),

                # Financial
                "total_market_value": clean_value(row.get("Total_Market_Value")),
                "total_assessed_value": clean_value(row.get("Total_Assessed_Value")),
                "exemptions": clean_value(row.get("Exemptions")),
                "taxable_value": clean_value(row.get("Taxable_Value")),

                # Tax Analysis
                "years_delinquent": int(clean_value(row.get("Years_Delinquent")) or 0),
                "total_amount_due": clean_value(row.get("Total_Amount_Due")),
                "face_amount": clean_value(row.get("Face_Amount")),
                "certificate_count": int(clean_value(row.get("Certificate_Count")) or 0),

                # Scores
                "tax_score": clean_value(row.get("Tax_Score")),
                "visual_score": clean_value(row.get("Visual_Score")),
                "final_combined_score": clean_value(row.get("Final_Combined_Score")),
                "tier": clean_value(row.get("Tier")),

                # Image
                "photo_url": get_image_url(account_number),

                # Default status for new properties
                "lead_status": "new",
                "approval_status": "pending",
            }

            if existing.data and len(existing.data) > 0:
                # Property exists - UPDATE only empty fields
                existing_prop = existing.data[0]

                # NEVER overwrite these approval/user tracking fields
                protected_fields = [
                    "approval_status", "approved_by", "approved_by_name",
                    "approved_at", "rejection_reason", "rejection_notes",
                    "created_by", "created_by_name", "updated_by", "updated_by_name"
                ]

                # Only update fields that are empty/null in existing record
                update_data = {}
                for key, value in property_data.items():
                    if key not in protected_fields:
                        existing_value = existing_prop.get(key)
                        if existing_value is None or existing_value == "" or existing_value == 0:
                            update_data[key] = value

                if update_data:
                    supabase.table("properties").update(update_data).eq("id", existing_prop["id"]).execute()
                    print(f"🔄 Updated: {account_number} ({len(update_data)} fields)")
                    updated += 1
                else:
                    print(f"⏭️  Skipped (complete): {account_number}")
                    skipped += 1

                success += 1
            else:
                # New property - INSERT
                supabase.table("properties").insert(property_data).execute()
                print(f"✅ Inserted: {account_number}")
                inserted += 1
                success += 1

        except Exception as e:
            print(f"❌ Error with {account_number}: {e}")
            errors += 1

        # Progress update every 100 rows
        if (idx + 1) % 100 == 0:
            print(f"\n--- Progress: {idx + 1}/{len(df)} ---\n")

    print(f"\n{'='*60}")
    print(f"✅ Total processed: {success}/{len(df)}")
    print(f"📥 Inserted (new): {inserted}")
    print(f"🔄 Updated (existing): {updated}")
    print(f"⏭️  Skipped (complete): {skipped}")
    if errors > 0:
        print(f"❌ Errors: {errors}")
    print(f"{'='*60}")

    print(f"\n🎉 Import complete!")
    print(f"✅ All existing approvals/rejections preserved")
    print(f"✅ New properties added with 'pending' status")

if __name__ == "__main__":
    import_properties()
