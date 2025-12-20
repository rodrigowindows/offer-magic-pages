"""
Delete old images with hyphens from Supabase Storage
Keep only images with underscores
"""

import requests

SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WjzxLQKNl-R0QGy68F6wgtXs"
BUCKET_NAME = "property-images"

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
}

print("="*80)
print("DELETE OLD IMAGES WITH HYPHENS FROM SUPABASE STORAGE")
print("="*80)

# List all files
url = f'{SUPABASE_URL}/storage/v1/object/list/{BUCKET_NAME}'
response = requests.post(url, headers=headers, json={'limit': 1000, 'prefix': ''})

if response.status_code != 200:
    print(f"ERROR listing files: {response.status_code}")
    print(response.text)
    exit(1)

files = response.json()
print(f"\nTotal files in storage: {len(files)}")

# Filter files with hyphens (old format)
files_to_delete = [f['name'] for f in files if '-' in f['name'] and f['name'].endswith('.jpg')]
print(f"Files with hyphens to delete: {len(files_to_delete)}")

if len(files_to_delete) == 0:
    print("\nNo files to delete. Done!")
    exit(0)

# Show first 10 files that will be deleted
print(f"\nFirst 10 files to delete:")
for name in files_to_delete[:10]:
    print(f"  - {name}")

# Ask for confirmation
print(f"\n[WARNING] This will DELETE {len(files_to_delete)} files from Supabase Storage!")
confirm = input("Type 'YES' to confirm: ")

if confirm != 'YES':
    print("Cancelled.")
    exit(0)

# Delete files in batches (Supabase allows batch delete)
deleted = 0
errors = []

# Delete in batches of 20
batch_size = 20
for i in range(0, len(files_to_delete), batch_size):
    batch = files_to_delete[i:i+batch_size]

    delete_url = f'{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}'

    # Supabase delete expects array of prefixes
    delete_data = {
        'prefixes': batch
    }

    response = requests.delete(delete_url, headers=headers, json=delete_data)

    if response.status_code in [200, 204]:
        deleted += len(batch)
        print(f"Progress: {deleted}/{len(files_to_delete)} deleted")
    else:
        for filename in batch:
            errors.append({
                'file': filename,
                'status': response.status_code,
                'error': response.text[:100]
            })
        print(f"ERROR deleting batch: {response.status_code} - {response.text[:100]}")

print("\n" + "="*80)
print("DELETE COMPLETE")
print("="*80)
print(f"Total files: {len(files_to_delete)}")
print(f"Deleted: {deleted}")
print(f"Errors: {len(errors)}")

if len(errors) > 0 and len(errors) <= 10:
    print("\nError details:")
    for err in errors:
        print(f"  - {err['file']}: {err.get('status', 'Unknown')}")

print("="*80)
