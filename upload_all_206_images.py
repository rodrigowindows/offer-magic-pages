"""
Upload ALL 206 property images referenced in CSV to Supabase Storage
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
CSV_FILE = Path("FINAL_PARA_IMPORT/01_DADOS_206_PROPERTIES_FIXED.csv")

print("="*80)
print("UPLOAD ALL 206 PROPERTY IMAGES TO SUPABASE STORAGE")
print("="*80)

# Load CSV to get list of images referenced
df = pd.read_csv(CSV_FILE)
df['image_filename'] = df['photo_url'].apply(lambda x: x.split('/')[-1] if pd.notna(x) else None)
images_needed = set(df['image_filename'].dropna().tolist())
print(f"\nImages referenced in CSV: {len(images_needed)}")

# Check which images exist locally
if not IMAGES_DIR.exists():
    print(f"ERROR: Images directory not found: {IMAGES_DIR}")
    exit(1)

images_to_upload = []
missing_images = []

for img_name in images_needed:
    img_path = IMAGES_DIR / img_name
    if img_path.exists():
        images_to_upload.append(img_path)
    else:
        missing_images.append(img_name)

print(f"Images found locally: {len(images_to_upload)}")
print(f"Missing images: {len(missing_images)}")

if missing_images:
    print(f"\nFirst 10 missing images:")
    for img in list(missing_images)[:10]:
        print(f"  - {img}")

if len(images_to_upload) == 0:
    print("\nNo images to upload!")
    exit(0)

# Upload images
uploaded = 0
skipped = 0
errors = []

print(f"\nStarting upload of {len(images_to_upload)} images...")

for image_path in images_to_upload:
    filename = image_path.name

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
            if skipped % 20 == 0:
                print(f"Skipped: {skipped} (already exist)")
        else:
            error_msg = response.text[:200]
            errors.append({
                'file': filename,
                'status': response.status_code,
                'error': error_msg
            })
            if len(errors) <= 5:
                print(f"ERROR: {filename} - {response.status_code}: {error_msg[:100]}")

    except Exception as e:
        errors.append({
            'file': filename,
            'error': str(e)
        })
        if len(errors) <= 5:
            print(f"EXCEPTION: {filename} - {str(e)[:100]}")

print("\n" + "="*80)
print("UPLOAD COMPLETE")
print("="*80)
print(f"Total images to upload: {len(images_to_upload)}")
print(f"Uploaded (new): {uploaded}")
print(f"Skipped (already exist): {skipped}")
print(f"Errors: {len(errors)}")
print(f"Missing locally: {len(missing_images)}")

if len(errors) > 0 and len(errors) <= 10:
    print("\nError details:")
    for err in errors:
        print(f"  - {err['file']}: {err.get('error', err.get('status', 'Unknown'))}")

print("\n" + "="*80)
print(f"Total images now in Supabase: {uploaded + skipped}")
print("="*80)
