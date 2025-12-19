#!/usr/bin/env python3
"""
Upload APENAS os 242-246 Leads Priorit rios para Supabase
==========================================================

Faz upload dos leads mais importantes:
- 238 properties distressed (P1-P6)
- 4 terrenos priorit rios (score 180+)
- Imagens correspondentes

Usage:
    python upload_priority_leads.py --preview     # Ver o que ser  uploadado
    python upload_priority_leads.py --data-only   # S  dados, sem imagens
    python upload_priority_leads.py --images-only # S  imagens, sem dados
    python upload_priority_leads.py              # Upload completo
"""

import sys
import os
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Try to import Supabase
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("\n   WARNING: Supabase not installed")
    print("Run: pip install supabase python-dotenv")
    print("\nContinuing in PREVIEW mode only...")

# Paths
CONTACT_LIST = Path("../Step 4 - AI Review & Evaluate/CONTACT_LISTS/CONTACT_LIST_FOCUSED.csv")
LAND_LIST = Path("../Step 4 - AI Review & Evaluate/CONTACT_LISTS/VACANT_LAND/VACANT_LAND_PRIORITY.csv")
IMAGES_DIR = Path("../Step 3 - Download Images/property_photos")
BUCKET_NAME = "property-images"


def slugify(account_number):
    """Convert account number to slug format"""
    return str(account_number).replace('_', '-').lower()


def load_priority_leads():
    """Load priority properties and land"""

    print("\n Loading priority leads...")

    # Load properties (238)
    if not CONTACT_LIST.exists():
        print(f" Not found: {CONTACT_LIST}")
        return None, None

    df_properties = pd.read_csv(CONTACT_LIST)
    print(f" Loaded {len(df_properties)} priority properties")

    # Load land (4)
    if LAND_LIST.exists():
        df_land = pd.read_csv(LAND_LIST)
        print(f" Loaded {len(df_land)} priority land parcels")
    else:
        print("   Land list not found, skipping")
        df_land = pd.DataFrame()

    # Combine
    total = len(df_properties) + len(df_land)
    print(f"\n TOTAL PRIORITY LEADS: {total}")
    print(f"   - Properties (distressed): {len(df_properties)}")
    print(f"   - Vacant land (high score): {len(df_land)}")

    return df_properties, df_land


def preview_upload(df_properties, df_land):
    """Preview what will be uploaded"""

    print("\n" + "=" * 80)
    print("PREVIEW: WHAT WILL BE UPLOADED")
    print("=" * 80)

    print("\n PROPERTIES (238):")
    print(f"\n{'Priority':<15} {'Count':>6}")
    print("-" * 80)
    for priority in df_properties['Priority_Class'].unique():
        count = len(df_properties[df_properties['Priority_Class'] == priority])
        print(f"{priority:<15} {count:>6}")

    print("\n Top 10 Properties (by priority):")
    top_10 = df_properties.head(10)
    for i, row in top_10.iterrows():
        print(f"\n{i+1}. {row['Account Number']}")
        print(f"   Priority: {row['Priority_Class']}")
        print(f"   Owner: {row['Owner Name'][:50]}")
        print(f"   Score: {row['Score']:.0f}, Condition: {row['Condition_Score']}/10")

    if len(df_land) > 0:
        print("\n   VACANT LAND (4):")
        for i, row in df_land.iterrows():
            print(f"\n{i+1}. {row['Account Number']}")
            print(f"   Owner: {row['Owner Name'][:50]}")
            print(f"   Score: {row['Score']:.0f}")

    # Check for images
    print("\n Checking for images...")
    all_accounts = pd.concat([
        df_properties['Account Number'],
        df_land['Account Number'] if len(df_land) > 0 else pd.Series()
    ])

    images_found = 0
    images_missing = 0

    for account in all_accounts:
        slug = slugify(account)
        image_path = IMAGES_DIR / f"{slug}.jpg"

        if not image_path.exists():
            # Try with underscores
            image_path = IMAGES_DIR / f"{account.replace('-', '_')}.jpg"

        if image_path.exists():
            images_found += 1
        else:
            images_missing += 1
            if images_missing <= 5:  # Show first 5 missing
                print(f"     Missing: {account}")

    print(f"\n   Images found: {images_found}")
    print(f"     Images missing: {images_missing}")

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"\nTotal leads to upload: {len(all_accounts)}")
    print(f"  - Properties: {len(df_properties)}")
    print(f"  - Land: {len(df_land)}")
    print(f"  - Images: {images_found}/{len(all_accounts)}")

    print("\n Preview complete.")
    print("Run without --preview to upload.")


def upload_to_supabase(df_properties, df_land, upload_images=True, upload_data=True):
    """Upload priority leads to Supabase"""

    if not SUPABASE_AVAILABLE:
        print("\n Supabase not available. Install first:")
        print("pip install supabase")
        return

    # Get credentials
    supabase_url = os.getenv('SUPABASE_URL') or os.getenv('VITE_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY') or os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

    if not supabase_url or not supabase_key:
        print("\n Supabase credentials not found in .env")
        print("\nCreate .env file with:")
        print("  SUPABASE_URL=https://your-project.supabase.co")
        print("  SUPABASE_KEY=your-key")
        return

    # Connect
    print(f"\n Connecting to Supabase...")
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print(" Connected")
    except Exception as e:
        print(f" Connection failed: {e}")
        return

    # Upload data
    if upload_data:
        print("\n" + "=" * 80)
        print("UPLOADING DATA TO DATABASE")
        print("=" * 80)

        uploaded_properties = 0
        uploaded_land = 0
        errors = []

        # Upload properties
        print(f"\n Uploading {len(df_properties)} properties...")
        for i, row in df_properties.iterrows():
            try:
                data = {
                    'account_number': str(row['Account Number']),
                    'slug': slugify(row['Account Number']),
                    'priority_class': str(row['Priority_Class']),
                    'lead_score': int(row['Score']) if pd.notna(row['Score']) else None,
                    'condition_score': int(row['Condition_Score']) if pd.notna(row['Condition_Score']) else None,
                    'condition_category': str(row['Condition_Category']) if pd.notna(row['Condition_Category']) else None,
                    'owner_name': str(row['Owner Name']) if pd.notna(row['Owner Name']) else None,
                    'property_address': str(row['Property Address']) if pd.notna(row['Property Address']) else None,
                    'visual_summary': str(row['Visual_Summary']) if pd.notna(row['Visual_Summary']) else None,
                    'equity': float(row['Equity']) if pd.notna(row['Equity']) else None,
                    'times_delinquent': int(row['Times Delinquent']) if pd.notna(row['Times Delinquent']) else 0,
                    'is_estate_trust': bool(row['Estate/Trust']) if pd.notna(row.get('Estate/Trust')) else False,
                    'is_out_of_state': bool(row['Out of State']) if pd.notna(row.get('Out of State')) else False,
                    'contact_status': 'not_contacted',
                    'is_vacant_land': False
                }

                # Upsert (insert or update)
                supabase.table('priority_leads').upsert(data, on_conflict='account_number').execute()
                uploaded_properties += 1

                if (i + 1) % 50 == 0:
                    print(f"  Progress: {i+1}/{len(df_properties)}")

            except Exception as e:
                errors.append(f"Property {row['Account Number']}: {str(e)}")
                if len(errors) <= 5:
                    print(f"   Error: {row['Account Number']}: {str(e)[:50]}")

        print(f" Uploaded {uploaded_properties} properties")

        # Upload land
        if len(df_land) > 0:
            print(f"\n   Uploading {len(df_land)} land parcels...")
            for i, row in df_land.iterrows():
                try:
                    data = {
                        'account_number': str(row['Account Number']),
                        'slug': slugify(row['Account Number']),
                        'priority_class': 'LAND-HIGH',
                        'lead_score': int(row['Score']) if pd.notna(row['Score']) else None,
                        'condition_category': 'VACANT LAND',
                        'owner_name': str(row['Owner Name']) if pd.notna(row['Owner Name']) else None,
                        'property_address': str(row['Property Address']) if pd.notna(row['Property Address']) else None,
                        'equity': float(row['Equity']) if pd.notna(row['Equity']) else None,
                        'times_delinquent': int(row['Times Delinquent']) if pd.notna(row['Times Delinquent']) else 0,
                        'contact_status': 'not_contacted',
                        'is_vacant_land': True
                    }

                    supabase.table('priority_leads').upsert(data, on_conflict='account_number').execute()
                    uploaded_land += 1

                except Exception as e:
                    errors.append(f"Land {row['Account Number']}: {str(e)}")
                    print(f"   Error: {row['Account Number']}: {str(e)[:50]}")

            print(f" Uploaded {uploaded_land} land parcels")

        print(f"\n Data Upload Summary:")
        print(f"   Properties: {uploaded_properties}/{len(df_properties)}")
        print(f"   Land: {uploaded_land}/{len(df_land)}")
        if errors:
            print(f"   Errors: {len(errors)}")

    # Upload images
    if upload_images:
        print("\n" + "=" * 80)
        print("UPLOADING IMAGES TO STORAGE")
        print("=" * 80)

        # Ensure bucket exists
        try:
            buckets = supabase.storage.list_buckets()
            bucket_names = [b['name'] for b in buckets]

            if BUCKET_NAME not in bucket_names:
                print(f"\n Creating bucket: {BUCKET_NAME}")
                supabase.storage.create_bucket(BUCKET_NAME, options={"public": True})
                print(" Bucket created")
        except Exception as e:
            print(f"   Could not verify bucket: {e}")

        # Upload images
        all_accounts = pd.concat([
            df_properties['Account Number'],
            df_land['Account Number'] if len(df_land) > 0 else pd.Series()
        ])

        uploaded_images = 0
        skipped_images = 0

        for i, account in enumerate(all_accounts, 1):
            slug = slugify(account)

            # Find image file
            image_path = IMAGES_DIR / f"{slug}.jpg"
            if not image_path.exists():
                image_path = IMAGES_DIR / f"{account.replace('-', '_')}.jpg"

            if not image_path.exists():
                skipped_images += 1
                continue

            try:
                # Read image
                with open(image_path, 'rb') as f:
                    image_data = f.read()

                # Upload path
                storage_path = f"properties/{slug}.jpg"

                # Upload
                try:
                    supabase.storage.from_(BUCKET_NAME).upload(
                        path=storage_path,
                        file=image_data,
                        file_options={"content-type": "image/jpeg"}
                    )
                except Exception as e:
                    # If already exists, skip
                    if 'already exists' not in str(e).lower():
                        raise

                # Get public URL
                public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(storage_path)

                # Update record with image URL
                supabase.table('priority_leads').update({
                    'property_image_url': public_url
                }).eq('account_number', str(account)).execute()

                uploaded_images += 1

                if i % 50 == 0:
                    print(f"  Progress: {i}/{len(all_accounts)}")

            except Exception as e:
                if i <= 5:
                    print(f"   Error uploading {account}: {str(e)[:50]}")

        print(f"\n Image Upload Summary:")
        print(f"   Uploaded: {uploaded_images}")
        print(f"    Skipped (not found): {skipped_images}")

    print("\n" + "=" * 80)
    print(" UPLOAD COMPLETE!")
    print("=" * 80)
    print(f"\nTotal leads uploaded: {uploaded_properties + uploaded_land}")
    print(f"Images uploaded: {uploaded_images}")
    print(f"\n View in Supabase Dashboard:")
    print(f"   {supabase_url}")


def main():
    print("\n" + "=" * 80)
    print("UPLOAD PRIORITY LEADS (242-246) TO SUPABASE")
    print("=" * 80)

    # Parse arguments
    preview_only = '--preview' in sys.argv
    data_only = '--data-only' in sys.argv
    images_only = '--images-only' in sys.argv

    # Load data
    df_properties, df_land = load_priority_leads()

    if df_properties is None:
        return

    # Preview mode
    if preview_only:
        preview_upload(df_properties, df_land)
        return

    # Confirm
    total = len(df_properties) + (len(df_land) if df_land is not None else 0)
    print(f"\n   About to upload {total} priority leads to Supabase")
    print(f"   - Properties: {len(df_properties)}")
    if df_land is not None and len(df_land) > 0:
        print(f"   - Land: {len(df_land)}")

    if not preview_only:
        response = input("\nContinue? (yes/no): ")
        if response.lower() != 'yes':
            print("Cancelled.")
            return

    # Upload
    upload_data = not images_only
    upload_images = not data_only

    upload_to_supabase(df_properties, df_land, upload_images, upload_data)


if __name__ == "__main__":
    main()
