"""
Automatic setup and upload to Supabase
This script will attempt to insert data directly into Supabase
"""

import pandas as pd
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

# Check if we have a service role key in .env (more permissions)
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Paths
CSV_FILE = Path("SUPABASE_UPLOAD_242_LEADS.csv")

def create_table_via_http():
    """Try to create table via HTTP POST to SQL endpoint"""
    print("\nAttempting to create table via Supabase SQL API...")

    # Read SQL file
    sql_file = Path("setup_supabase_tables.sql")
    if not sql_file.exists():
        print(f"ERROR: {sql_file} not found")
        return False

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()

    # Try to execute via REST API (this usually requires service role key)
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY if SUPABASE_SERVICE_KEY else SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    payload = {"query": sql}

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            print("Table created successfully!")
            return True
        else:
            print(f"Failed to create table: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def upload_data_via_rest():
    """Upload data via REST API"""
    print("\nUploading data via REST API...")

    if not CSV_FILE.exists():
        print(f"ERROR: {CSV_FILE} not found")
        return False

    # Load CSV
    df = pd.read_csv(CSV_FILE)
    print(f"Loaded {len(df)} rows from CSV")

    # Convert to list of dicts
    records = df.to_dict('records')

    # Clean up NaN values
    for record in records:
        for key, value in record.items():
            if pd.isna(value):
                record[key] = None

    url = f"{SUPABASE_URL}/rest/v1/priority_leads"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # Upload in batches of 50
    batch_size = 50
    total_uploaded = 0
    errors = []

    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        print(f"Uploading batch {i//batch_size + 1}/{(len(records)-1)//batch_size + 1} ({len(batch)} records)...")

        try:
            response = requests.post(url, json=batch, headers=headers)

            if response.status_code in [200, 201]:
                total_uploaded += len(batch)
                print(f"  Success! Total uploaded: {total_uploaded}/{len(records)}")
            else:
                error_msg = f"Batch {i//batch_size + 1} failed: {response.status_code} - {response.text[:200]}"
                print(f"  ERROR: {error_msg}")
                errors.append(error_msg)

                # If table doesn't exist, stop
                if "priority_leads" in response.text and "does not exist" in response.text.lower():
                    print("\nERROR: Table 'priority_leads' does not exist!")
                    print("You must create it manually in Supabase Dashboard first.")
                    return False

        except Exception as e:
            error_msg = f"Batch {i//batch_size + 1} error: {str(e)}"
            print(f"  ERROR: {error_msg}")
            errors.append(error_msg)

    print(f"\n{'='*80}")
    print(f"Upload Complete!")
    print(f"Total uploaded: {total_uploaded}/{len(records)}")
    if errors:
        print(f"Errors: {len(errors)}")
    print(f"{'='*80}")

    return total_uploaded > 0

def main():
    print("="*80)
    print("AUTOMATIC SUPABASE SETUP AND UPLOAD")
    print("="*80)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\nERROR: Missing Supabase credentials")
        return

    print(f"\nSupabase URL: {SUPABASE_URL}")
    print(f"Using key: {SUPABASE_KEY[:20]}...")

    # Option 1: Try to create table (will likely fail with anon key)
    print("\n" + "="*80)
    print("STEP 1: CREATE TABLE")
    print("="*80)

    print("\nNOTE: Table creation requires manual setup via Dashboard")
    print("The anon/publishable key cannot execute DDL (CREATE TABLE) statements.")
    print("\nPlease create the table manually:")
    print("1. Open: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql")
    print("2. Copy contents of: setup_supabase_tables.sql")
    print("3. Paste and Run")

    input("\nPress ENTER after you've created the table in Supabase Dashboard...")

    # Option 2: Upload data
    print("\n" + "="*80)
    print("STEP 2: UPLOAD DATA")
    print("="*80)

    success = upload_data_via_rest()

    if success:
        print("\nSUCCESS! Data uploaded to Supabase")
        print(f"\nView your data:")
        print(f"https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor")
    else:
        print("\nUPLOAD FAILED")
        print("\nManual upload instructions:")
        print("1. Go to: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor")
        print("2. Click on 'priority_leads' table")
        print("3. Click 'Insert' > 'Import data from CSV'")
        print(f"4. Select: {CSV_FILE.absolute()}")

if __name__ == "__main__":
    main()
