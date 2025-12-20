"""
Simple upload script - just uploads the data
Assumes table already exists
"""

import pandas as pd
import os
import requests
from pathlib import Path
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

CSV_FILE = Path("SUPABASE_UPLOAD_242_LEADS.csv")

print("="*80)
print("SIMPLE SUPABASE UPLOAD")
print("="*80)

if not CSV_FILE.exists():
    print(f"\nERROR: {CSV_FILE} not found")
    print("Run: python prepare_for_manual_upload.py first")
    exit(1)

# Load CSV
df = pd.read_csv(CSV_FILE)
print(f"\nLoaded {len(df)} rows from {CSV_FILE}")

# Convert to list of dicts and clean NaN
records = []
for _, row in df.iterrows():
    record = {}
    for key, value in row.items():
        if pd.isna(value):
            record[key] = None
        elif isinstance(value, (int, float, bool)):
            record[key] = value
        else:
            record[key] = str(value)
    records.append(record)

print(f"Prepared {len(records)} records for upload")

# Try to upload
url = f"{SUPABASE_URL}/rest/v1/priority_leads"
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal,resolution=ignore-duplicates"
}

print(f"\nUploading to: {url}")
print("Using upsert mode (will skip duplicates)")

# Upload in smaller batches
batch_size = 10
total_uploaded = 0
total_skipped = 0
errors = []

for i in range(0, len(records), batch_size):
    batch = records[i:i+batch_size]
    batch_num = i//batch_size + 1
    total_batches = (len(records)-1)//batch_size + 1

    print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} records)...", end=" ")

    try:
        response = requests.post(url, json=batch, headers=headers)

        if response.status_code in [200, 201]:
            total_uploaded += len(batch)
            print(f"OK ({total_uploaded} total)")

        elif response.status_code == 409:  # Conflict/duplicate
            total_skipped += len(batch)
            print(f"SKIPPED (duplicates)")

        else:
            error_detail = response.text[:300]
            print(f"ERROR {response.status_code}")

            # Check for specific errors
            if "relation \"public.priority_leads\" does not exist" in error_detail:
                print("\n" + "="*80)
                print("ERROR: Table 'priority_leads' does not exist!")
                print("="*80)
                print("\nYou must create it first:")
                print("1. Open: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql")
                print("2. Copy ALL content from: setup_supabase_tables.sql")
                print("3. Paste and click RUN")
                print("\nThen run this script again.")
                exit(1)

            errors.append({
                'batch': batch_num,
                'status': response.status_code,
                'detail': error_detail
            })

    except Exception as e:
        print(f"EXCEPTION: {str(e)[:100]}")
        errors.append({
            'batch': batch_num,
            'error': str(e)
        })

print("\n" + "="*80)
print("UPLOAD SUMMARY")
print("="*80)
print(f"Total records: {len(records)}")
print(f"Uploaded: {total_uploaded}")
print(f"Skipped (duplicates): {total_skipped}")
print(f"Errors: {len(errors)}")

if errors:
    print("\nFirst few errors:")
    for err in errors[:5]:
        print(f"  - Batch {err.get('batch', '?')}: {err.get('status', err.get('error', 'Unknown'))}")

if total_uploaded > 0:
    print("\nSUCCESS! Data is now in Supabase")
    print(f"\nView your data:")
    print(f"https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor")
else:
    print("\nNO DATA WAS UPLOADED")
    if not errors:
        print("All records may already exist (duplicates)")

print("="*80)
