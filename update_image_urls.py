"""
Update property_image_url for existing properties with correct Supabase URLs
"""

import pandas as pd
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

CSV_FILE = "FINAL_PARA_IMPORT/01_DADOS_206_PROPERTIES_FIXED.csv"

print("="*80)
print("UPDATE IMAGE URLS IN DATABASE")
print("="*80)

# Load CSV
df = pd.read_csv(CSV_FILE)
print(f"\nLoaded {len(df)} rows from CSV")

# Filter rows with photo_url
df_with_images = df[df['photo_url'].notna()].copy()
print(f"Found {len(df_with_images)} rows with image URLs")

updated = 0
skipped = 0
errors = []

for idx, row in df_with_images.iterrows():
    account = row['account_number']
    image_url = row['photo_url']

    # Convert account from hyphen to underscore for database lookup
    # Database might have 'origem' field with underscores or hyphens - we try both

    try:
        # Try updating by origem field (account_number)
        result = supabase.table('properties').update({
            'property_image_url': image_url
        }).eq('origem', account).execute()

        if result.data and len(result.data) > 0:
            updated += 1
            if updated % 20 == 0:
                print(f"Progress: {updated}/{len(df_with_images)} updated")
        else:
            # Try with underscore format
            account_underscore = account.replace('-', '_')
            result2 = supabase.table('properties').update({
                'property_image_url': image_url
            }).eq('origem', account_underscore).execute()

            if result2.data and len(result2.data) > 0:
                updated += 1
                if updated % 20 == 0:
                    print(f"Progress: {updated}/{len(df_with_images)} updated")
            else:
                skipped += 1
                if skipped <= 5:
                    print(f"  Skipped (not found): {account}")

    except Exception as e:
        errors.append({'account': account, 'error': str(e)})
        if len(errors) <= 5:
            print(f"  ERROR {account}: {str(e)[:100]}")

print("\n" + "="*80)
print("UPDATE COMPLETE")
print("="*80)
print(f"Total rows: {len(df_with_images)}")
print(f"Updated: {updated}")
print(f"Skipped: {skipped}")
print(f"Errors: {len(errors)}")
print("="*80)
