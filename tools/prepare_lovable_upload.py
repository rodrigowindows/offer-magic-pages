"""
Prepara arquivo final para upload no Lovable
- Remove duplicatas
- Adiciona URLs das imagens que existem
- Filtra apenas properties com fotos
"""

import pandas as pd
import os
from pathlib import Path

# Paths
CSV_INPUT = "../SUPABASE_UPLOAD_242_LEADS_CLEAN.csv"
IMAGES_DIR = "../../Step 3 - Download Images/property_photos"
OUTPUT_CSV = "../LOVABLE_UPLOAD_WITH_IMAGES.csv"

# Supabase Storage URL (você vai substituir com o URL real depois do upload)
STORAGE_BASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co/storage/v1/object/public/property-photos"

def main():
    print("Loading CSV...")
    df = pd.read_csv(CSV_INPUT)

    print(f"Total de linhas: {len(df)}")

    # Remove duplicatas baseado em account_number
    print("\nRemovendo duplicatas...")
    df_unique = df.drop_duplicates(subset=['account_number'], keep='first')
    print(f"Apos remover duplicatas: {len(df_unique)}")

    # Verifica quais imagens existem
    print("\nVerificando imagens disponiveis...")
    images_path = Path(IMAGES_DIR)
    available_images = {img.stem for img in images_path.glob("*.jpg")}
    print(f"Total de imagens: {len(available_images)}")

    # Adiciona coluna de URL da imagem
    def get_image_url(account_number):
        if pd.isna(account_number):
            return None
        # Converte - para _ para match com nomes dos arquivos
        image_filename = str(account_number).replace('-', '_')
        if image_filename in available_images:
            return f"{STORAGE_BASE_URL}/{image_filename}.jpg"
        return None

    df_unique['photo_url'] = df_unique['account_number'].apply(get_image_url)

    # Filtra apenas properties com imagens
    df_with_images = df_unique[df_unique['photo_url'].notna()].copy()

    print(f"\nProperties com imagens: {len(df_with_images)}")

    # Remove vacant land (opcional - descomente se quiser só properties)
    # df_with_images = df_with_images[df_with_images['is_vacant_land'] != True]

    # Reorganiza colunas (coloca photo_url logo após account_number)
    cols = list(df_with_images.columns)
    cols.remove('photo_url')
    cols.insert(2, 'photo_url')  # Coloca após property_address
    df_with_images = df_with_images[cols]

    # Salva arquivo final
    df_with_images.to_csv(OUTPUT_CSV, index=False)

    print(f"\nArquivo salvo: {OUTPUT_CSV}")
    print(f"\nRESUMO:")
    print(f"   - Total original: {len(df)}")
    print(f"   - Apos remover duplicatas: {len(df_unique)}")
    print(f"   - Com imagens disponiveis: {len(df_with_images)}")

    # Breakdown por condition
    print(f"\nBREAKDOWN POR CONDICAO:")
    condition_counts = df_with_images['condition_category'].value_counts()
    for condition, count in condition_counts.items():
        print(f"   - {condition}: {count}")

    # Breakdown por tier
    if 'priority_tier' in df_with_images.columns:
        print(f"\nBREAKDOWN POR TIER:")
        tier_counts = df_with_images['priority_tier'].value_counts().sort_index()
        for tier, count in tier_counts.items():
            print(f"   - {tier}: {count}")

    print(f"\nPRONTO PARA UPLOAD NO LOVABLE!")
    print(f"\nPROXIMO PASSO:")
    print(f"   1. Upload das imagens para Supabase Storage (bucket: property-photos)")
    print(f"   2. Usar script import_csv_to_supabase.py para importar dados")

if __name__ == "__main__":
    main()
