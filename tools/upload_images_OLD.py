#!/usr/bin/env python3
"""
Upload Property Images to Supabase Storage
==========================================

Uploads property photos from Step 3 to Supabase storage bucket
and updates property records with image URLs.

Usage:
    python upload_images.py                  # Upload all images
    python upload_images.py --limit 10       # Upload first 10 only (testing)
    python upload_images.py --preview        # Preview without uploading

Requirements:
    pip install supabase python-dotenv pillow
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Try to import Supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("\n⚠️  ERROR: Supabase not installed")
    print("Run: pip install supabase python-dotenv")
    sys.exit(1)

# Configuration
IMAGES_DIR = Path("../Step 3 - Download Images/property_photos")
BUCKET_NAME = "property-images"


def slugify(account_number):
    """Convert account number to slug format"""
    # Remove underscores, convert to lowercase with hyphens
    slug = account_number.replace('_', '-').lower()
    return slug


def get_account_from_filename(filename):
    """Extract account number from image filename"""
    # Remove .jpg extension
    account = filename.replace('.jpg', '')
    # Convert underscores to hyphens for slug
    slug = slugify(account)
    return account, slug


def upload_image_to_supabase(supabase: Client, image_path: Path, slug: str):
    """
    Upload image to Supabase storage and return public URL

    Returns: (success: bool, url: str or error: str)
    """
    try:
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()

        # Upload to storage bucket
        # Path in bucket: properties/{slug}.jpg
        storage_path = f"properties/{slug}.jpg"

        result = supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=image_data,
            file_options={"content-type": "image/jpeg"}
        )

        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)

        return True, public_url

    except Exception as e:
        error_msg = str(e)
        # If already exists, get the URL anyway
        if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
            try:
                public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(f"properties/{slug}.jpg")
                return True, public_url
            except:
                pass
        return False, error_msg


def update_property_image_url(supabase: Client, slug: str, image_url: str):
    """Update property record with image URL"""
    try:
        result = supabase.table('properties').update({
            'property_image_url': image_url
        }).eq('slug', slug).execute()

        return True, None
    except Exception as e:
        return False, str(e)


def ensure_bucket_exists(supabase: Client):
    """Create storage bucket if it doesn't exist"""
    try:
        # Try to list buckets
        buckets = supabase.storage.list_buckets()
        bucket_names = [b['name'] for b in buckets]

        if BUCKET_NAME not in bucket_names:
            print(f"\n📦 Creating storage bucket: {BUCKET_NAME}")
            supabase.storage.create_bucket(
                BUCKET_NAME,
                options={"public": True}
            )
            print("✅ Bucket created")
        else:
            print(f"✅ Bucket '{BUCKET_NAME}' already exists")

        return True
    except Exception as e:
        print(f"❌ Error with storage bucket: {e}")
        return False


def main():
    print("\n" + "=" * 80)
    print("UPLOAD PROPERTY IMAGES TO SUPABASE")
    print("=" * 80)

    # Parse arguments
    preview_only = '--preview' in sys.argv
    limit = None
    if '--limit' in sys.argv:
        try:
            limit_idx = sys.argv.index('--limit')
            limit = int(sys.argv[limit_idx + 1])
        except (IndexError, ValueError):
            print("❌ Invalid --limit value")
            return

    # Check images directory
    if not IMAGES_DIR.exists():
        print(f"\n❌ Images directory not found: {IMAGES_DIR}")
        return

    # Get all image files
    images = sorted(list(IMAGES_DIR.glob("*.jpg")))

    if not images:
        print(f"\n❌ No images found in {IMAGES_DIR}")
        return

    print(f"\n📁 Found {len(images)} images in {IMAGES_DIR}")

    # Apply limit if specified
    if limit:
        images = images[:limit]
        print(f"🔢 Limited to first {limit} images")

    # Preview mode
    if preview_only:
        print("\n" + "=" * 80)
        print("PREVIEW MODE - First 10 images:")
        print("=" * 80)
        for i, img in enumerate(images[:10], 1):
            account, slug = get_account_from_filename(img.name)
            print(f"\n{i}. {img.name}")
            print(f"   Account: {account}")
            print(f"   Slug: {slug}")
            print(f"   Will upload to: properties/{slug}.jpg")

        if len(images) > 10:
            print(f"\n... and {len(images) - 10} more")

        print("\n✅ Preview complete. Run without --preview to upload.")
        return

    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

    if not supabase_url or not supabase_key:
        print("\n❌ Supabase credentials not found in .env file")
        print("\nAdd to .env:")
        print("  SUPABASE_URL=https://your-project.supabase.co")
        print("  SUPABASE_KEY=your-key")
        return

    # Connect to Supabase
    print(f"\n🔌 Connecting to Supabase...")
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return

    # Ensure bucket exists
    if not ensure_bucket_exists(supabase):
        print("\n⚠️  Warning: Could not verify/create storage bucket")
        print("You may need to create it manually in Supabase dashboard:")
        print(f"  1. Go to Storage")
        print(f"  2. Create bucket: {BUCKET_NAME}")
        print(f"  3. Make it public")
        response = input("\nContinue anyway? (yes/no): ")
        if response.lower() != 'yes':
            return

    # Upload images
    print("\n" + "=" * 80)
    print("UPLOADING IMAGES")
    print("=" * 80)

    uploaded = 0
    skipped = 0
    failed = 0

    for i, img_path in enumerate(images, 1):
        account, slug = get_account_from_filename(img_path.name)

        print(f"\n[{i}/{len(images)}] {img_path.name}")
        print(f"  Slug: {slug}")

        # Upload image
        success, result = upload_image_to_supabase(supabase, img_path, slug)

        if success:
            image_url = result
            print(f"  ✓ Uploaded: {image_url[:60]}...")

            # Update property record
            update_success, error = update_property_image_url(supabase, slug, image_url)

            if update_success:
                print(f"  ✓ Property record updated")
                uploaded += 1
            else:
                print(f"  ⚠️  Upload OK but property update failed: {error}")
                uploaded += 1
        else:
            error = result
            if 'not found' in error.lower():
                print(f"  ⊘ Property not found in database (skipped)")
                skipped += 1
            else:
                print(f"  ✗ Upload failed: {error}")
                failed += 1

    # Summary
    print("\n" + "=" * 80)
    print("UPLOAD COMPLETE")
    print("=" * 80)
    print(f"\n✅ Uploaded: {uploaded}")
    print(f"⊘ Skipped: {skipped}")
    print(f"✗ Failed: {failed}")
    print(f"━━ Total: {len(images)}")

    if uploaded > 0:
        print("\n🎉 Success! Images are now linked to properties.")
        print("View them in the Offer Magic admin panel.")


if __name__ == "__main__":
    main()
