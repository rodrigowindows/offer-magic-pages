"""
Upload property images to Supabase Storage

Uploads all images from Step 3 property_photos/ to Supabase Storage bucket.
Images will be accessible at: https://[project].supabase.co/storage/v1/object/public/property-photos/[account-number].jpg
"""

import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Get from Supabase Dashboard → Settings → API
SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g., https://xxx.supabase.co
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

BUCKET_NAME = "property-photos"
PHOTOS_DIR = "../../Step 3 - Download Images/property_photos"

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
    elif response.status_code == 409:
        print(f"⏭️  Already exists: {account_number}.jpg")
        return True
    else:
        print(f"❌ Failed: {account_number}.jpg - {response.status_code} {response.text}")
        return False

def main():
    # Validate environment
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
        print("\nCreate a .env file with:")
        print("SUPABASE_URL=https://your-project.supabase.co")
        print("SUPABASE_ANON_KEY=your-anon-key-here")
        return

    photos_path = Path(PHOTOS_DIR)

    if not photos_path.exists():
        print(f"❌ Error: Photos directory not found: {PHOTOS_DIR}")
        return

    images = list(photos_path.glob("*.jpg"))

    if not images:
        print(f"❌ Error: No .jpg images found in {PHOTOS_DIR}")
        return

    print(f"📸 Found {len(images)} images to upload")
    print(f"📁 Uploading to bucket: {BUCKET_NAME}")
    print(f"🌐 URL: {SUPABASE_URL}\n")

    success = 0
    failed = 0

    for img_path in images:
        if upload_image(img_path):
            success += 1
        else:
            failed += 1

    print(f"\n{'='*50}")
    print(f"✅ Successfully uploaded: {success}/{len(images)}")
    if failed > 0:
        print(f"❌ Failed: {failed}")
    print(f"{'='*50}")

    print(f"\n🔗 Images accessible at:")
    print(f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/[account-number].jpg")

if __name__ == "__main__":
    main()
