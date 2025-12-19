"""
Upload with better error handling - uploads one by one and shows errors
"""

import pandas as pd
import requests
import os
import json

# Load environment
SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs"

CSV_FILE = "SUPABASE_UPLOAD_242_LEADS.csv"

print("="*80)
print("SUPABASE UPLOAD WITH ERROR HANDLING")
print("="*80)

# Load CSV
df = pd.read_csv(CSV_FILE)
print(f"\nLoaded {len(df)} rows from {CSV_FILE}")

# Prepare URL and headers
url = f"{SUPABASE_URL}/rest/v1/priority_leads"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal,resolution=merge-duplicates"
}

uploaded = 0
skipped = 0
errors = []

# Upload one by one to see exactly which records fail
for idx, row in df.iterrows():
    # Convert to dict and clean
    record = {}
    for key, value in row.items():
        if pd.isna(value):
            record[key] = None
        elif key in ['beds', 'year_built', 'sqft', 'lot_size', 'just_value', 'taxable_value',
                     'years_delinquent', 'equity_estimate', 'estimated_repair_cost_low',
                     'estimated_repair_cost_high', 'lead_score', 'condition_score']:
            # Ensure numeric fields are int or None
            try:
                record[key] = int(value) if not pd.isna(value) else None
            except:
                record[key] = None
        elif key == 'baths':
            # Ensure baths is numeric
            try:
                record[key] = float(value) if not pd.isna(value) else None
            except:
                record[key] = None
        elif key == 'total_tax_due':
            # Ensure tax is numeric
            try:
                record[key] = float(value) if not pd.isna(value) else None
            except:
                record[key] = None
        elif key in ['is_estate', 'is_out_of_state', 'appears_vacant', 'is_vacant_land']:
            # Ensure boolean fields
            if pd.isna(value):
                record[key] = None
            elif isinstance(value, bool):
                record[key] = value
            elif str(value).lower() in ['true', '1', 'yes']:
                record[key] = True
            elif str(value).lower() in ['false', '0', 'no']:
                record[key] = False
            else:
                record[key] = None
        else:
            # String fields
            record[key] = str(value) if not pd.isna(value) else None

    account = record.get('account_number', f'row_{idx}')

    try:
        response = requests.post(url, json=[record], headers=headers)

        if response.status_code in [200, 201]:
            uploaded += 1
            if (uploaded + skipped) % 20 == 0:
                print(f"Progress: {uploaded} uploaded, {skipped} skipped, {len(errors)} errors")
        elif response.status_code == 409:
            skipped += 1
        else:
            error_detail = response.text[:200]
            errors.append({
                'account': account,
                'status': response.status_code,
                'error': error_detail
            })
            print(f"ERROR: {account} - {response.status_code}: {error_detail[:100]}")

    except Exception as e:
        errors.append({
            'account': account,
            'error': str(e)
        })
        print(f"EXCEPTION: {account} - {str(e)[:100]}")

print("\n" + "="*80)
print("UPLOAD COMPLETE")
print("="*80)
print(f"Total records: {len(df)}")
print(f"Uploaded: {uploaded}")
print(f"Skipped (duplicates): {skipped}")
print(f"Errors: {len(errors)}")

if errors and len(errors) <= 10:
    print("\nError details:")
    for err in errors[:10]:
        print(f"  - {err['account']}: {err.get('error', err.get('status', 'Unknown'))}")

if uploaded > 0:
    print(f"\nView your data:")
    print(f"https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor")

print("="*80)
