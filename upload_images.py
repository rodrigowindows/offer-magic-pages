"""
Upload property images to Supabase Storage
"""

import os
import requests
from pathlib import Path
import pandas as pd

# Supabase credentials
SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs"

BUCKET_NAME = "property-images"
IMAGES_DIR = Path("../Step 3 - Download Images/property_photos")
CSV_FILE = Path("SUPABASE_UPLOAD_242_LEADS.csv")

print("="*80)
print("UPLOAD PROPERTY IMAGES TO SUPABASE STORAGE")
print("="*80)

# Load CSV to get list of account numbers
df = pd.read_csv(CSV_FILE)
accounts = set(df['account_number'].tolist())
print(f"\nFound {len(accounts)} accounts in CSV")

# Get list of images
if not IMAGES_DIR.exists():
    print(f"ERROR: Images directory not found: {IMAGES_DIR}")
    exit(1)

images = list(IMAGES_DIR.glob("*.jpg"))
print(f"Found {len(images)} images in {IMAGES_DIR}")

# Filter to only upload images for accounts in our CSV
images_to_upload = []
for img in images:
    # Convert filename to account number format
    account = img.stem.replace('_', '-')
    if account in accounts:
        images_to_upload.append((account, img))

print(f"Will upload {len(images_to_upload)} images (matched to CSV)")

# Upload images
uploaded = 0
skipped = 0
errors = []

for account, image_path in images_to_upload:
    # Format filename
    filename = f"{account}.jpg"

    # Upload URL
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    try:
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()

        # Upload
        response = requests.post(
            url,
            headers=headers,
            files={'file': (filename, image_data, 'image/jpeg')}
        )

        if response.status_code in [200, 201]:
            uploaded += 1
            if uploaded % 20 == 0:
                print(f"Progress: {uploaded}/{len(images_to_upload)} uploaded")
        elif response.status_code == 409:
            # Already exists
            skipped += 1
        else:
            error_msg = response.text[:200]
            errors.append({
                'account': account,
                'status': response.status_code,
                'error': error_msg
            })
            if len(errors) <= 5:
                print(f"ERROR: {account} - {response.status_code}: {error_msg[:100]}")

    except Exception as e:
        errors.append({
            'account': account,
            'error': str(e)
        })
        if len(errors) <= 5:
            print(f"EXCEPTION: {account} - {str(e)[:100]}")

print("\n" + "="*80)
print("UPLOAD COMPLETE")
print("="*80)
print(f"Total images: {len(images_to_upload)}")
print(f"Uploaded: {uploaded}")
print(f"Skipped (already exist): {skipped}")
print(f"Errors: {len(errors)}")

if len(errors) > 0 and len(errors) <= 10:
    print("\nError details:")
    for err in errors:
        print(f"  - {err['account']}: {err.get('error', err.get('status', 'Unknown'))}")

if uploaded > 0:
    print(f"\nView images in Storage:")
    print(f"https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/storage/buckets/property-images")

    # Show example URL
    if images_to_upload:
        example_account = images_to_upload[0][0]
        example_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{example_account}.jpg"
        print(f"\nExample image URL:")
        print(f"{example_url}")

print("="*80)
