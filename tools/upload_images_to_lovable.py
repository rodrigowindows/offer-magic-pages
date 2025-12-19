"""
Upload das 84 imagens para Supabase Storage
Lê o CSV LOVABLE_UPLOAD_WITH_IMAGES.csv e faz upload das imagens correspondentes
"""

import os
import requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
BUCKET_NAME = "property-photos"

CSV_FILE = "../LOVABLE_UPLOAD_WITH_IMAGES.csv"
IMAGES_DIR = "../../Step 3 - Download Images/property_photos"

def upload_image(account_number):
    """Upload single image to Supabase Storage"""
    # Convert account number format: 28-22-29-5600-81200 -> 28_22_29_5600_81200
    image_filename = account_number.replace('-', '_') + '.jpg'
    image_path = Path(IMAGES_DIR) / image_filename

    if not image_path.exists():
        print(f"  X File not found: {image_filename}")
        return False

    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{image_filename}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "image/jpeg"
    }

    with open(image_path, "rb") as f:
        response = requests.post(url, headers=headers, data=f)

    if response.status_code in [200, 201]:
        print(f"  OK Uploaded: {image_filename}")
        return True
    elif response.status_code == 409:
        print(f"  >> Already exists: {image_filename}")
        return True
    else:
        print(f"  X Failed: {image_filename} - {response.status_code} {response.text}")
        return False

def main():
    # Validate environment
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("ERRO: SUPABASE_URL e SUPABASE_ANON_KEY devem estar no arquivo .env")
        print("\nCrie um arquivo .env com:")
        print("SUPABASE_URL=https://atwdkhlyrffbaugkaker.supabase.co")
        print("SUPABASE_ANON_KEY=sua-chave-anon-aqui")
        return

    # Load CSV
    if not os.path.exists(CSV_FILE):
        print(f"ERRO: Arquivo nao encontrado: {CSV_FILE}")
        return

    df = pd.read_csv(CSV_FILE)
    print(f"\nCarregando {len(df)} properties do CSV...")

    print(f"\nIniciando upload de {len(df)} imagens para Supabase Storage...")
    print(f"Bucket: {BUCKET_NAME}")
    print(f"URL: {SUPABASE_URL}\n")

    success = 0
    failed = 0

    for idx, row in df.iterrows():
        account_number = row['account_number']
        if upload_image(account_number):
            success += 1
        else:
            failed += 1

    print(f"\n{'='*60}")
    print(f"RESULTADO:")
    print(f"  Sucesso: {success}/{len(df)}")
    if failed > 0:
        print(f"  Falhas: {failed}")
    print(f"{'='*60}")

    print(f"\nImagens disponiveis em:")
    print(f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/[filename].jpg")

    print(f"\nPROXIMO PASSO: Rode import_csv_to_lovable.py para importar os dados")

if __name__ == "__main__":
    main()
