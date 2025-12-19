"""
Importa as 84 properties para o Supabase
Cria tabela 'properties' e importa todos os dados
"""

import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

CSV_FILE = "../LOVABLE_UPLOAD_WITH_IMAGES.csv"

def clean_value(value):
    """Clean pandas values for Supabase"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        if value == float('inf') or value == float('-inf'):
            return None
        return float(value)
    if isinstance(value, str):
        if value.strip() == '':
            return None
    return value

def import_properties():
    """Import CSV data to Supabase"""

    # Validate environment
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("ERRO: SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar no arquivo .env")
        print("\nCrie um arquivo .env com:")
        print("SUPABASE_URL=https://atwdkhlyrffbaugkaker.supabase.co")
        print("SUPABASE_SERVICE_KEY=sua-chave-service-role-aqui")
        print("\nUSE SERVICE ROLE KEY (nao anon key) para acesso admin")
        return

    # Load CSV
    if not os.path.exists(CSV_FILE):
        print(f"ERRO: Arquivo nao encontrado: {CSV_FILE}")
        return

    df = pd.read_csv(CSV_FILE)
    print(f"\nCarregando {len(df)} properties do CSV...")

    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    success = 0
    updated = 0
    inserted = 0
    errors = 0

    for idx, row in df.iterrows():
        account_number = row.get('account_number')

        if pd.isna(account_number):
            print(f"  X Linha {idx}: account_number vazio")
            errors += 1
            continue

        try:
            # Check if property exists
            existing = supabase.table("properties").select("*").eq("account_number", account_number).execute()

            # Prepare data
            property_data = {
                "account_number": clean_value(account_number),
                "property_address": clean_value(row.get("property_address")),
                "photo_url": clean_value(row.get("photo_url")),

                # Condition
                "condition_score": clean_value(row.get("condition_score")),
                "condition_category": clean_value(row.get("condition_category")),
                "visual_summary": clean_value(row.get("visual_summary")),
                "appears_vacant": clean_value(row.get("appears_vacant")),
                "lawn_condition": clean_value(row.get("lawn_condition")),
                "exterior_condition": clean_value(row.get("exterior_condition")),
                "roof_condition": clean_value(row.get("roof_condition")),
                "visible_issues": clean_value(row.get("visible_issues")),

                # Owner info
                "owner_name": clean_value(row.get("owner_name")),
                "mailing_address": clean_value(row.get("mailing_address")),
                "mailing_city": clean_value(row.get("mailing_city")),
                "mailing_state": clean_value(row.get("mailing_state")),
                "mailing_zip": clean_value(row.get("mailing_zip")),

                # Property details
                "property_type": clean_value(row.get("property_type")),
                "beds": clean_value(row.get("beds")),
                "baths": clean_value(row.get("baths")),
                "year_built": clean_value(row.get("year_built")),
                "sqft": clean_value(row.get("sqft")),
                "lot_size": clean_value(row.get("lot_size")),

                # Financial
                "just_value": clean_value(row.get("just_value")),
                "taxable_value": clean_value(row.get("taxable_value")),
                "exemptions": clean_value(row.get("exemptions")),
                "total_tax_due": clean_value(row.get("total_tax_due")),
                "years_delinquent": int(clean_value(row.get("years_delinquent")) or 0),

                # Scoring
                "lead_score": clean_value(row.get("lead_score")),
                "priority_tier": clean_value(row.get("priority_tier")),

                # Estimates
                "equity_estimate": clean_value(row.get("equity_estimate")),
                "estimated_repair_cost_low": clean_value(row.get("estimated_repair_cost_low")),
                "estimated_repair_cost_high": clean_value(row.get("estimated_repair_cost_high")),

                # Flags
                "is_estate": clean_value(row.get("is_estate")),
                "is_out_of_state": clean_value(row.get("is_out_of_state")),
                "is_vacant_land": clean_value(row.get("is_vacant_land")),
                "distress_indicators": clean_value(row.get("distress_indicators")),

                # Status
                "lead_status": "new",
                "approval_status": "pending",
            }

            if existing.data and len(existing.data) > 0:
                # Update existing
                property_id = existing.data[0]["id"]
                supabase.table("properties").update(property_data).eq("id", property_id).execute()
                print(f"  >> Updated: {account_number}")
                updated += 1
            else:
                # Insert new
                supabase.table("properties").insert(property_data).execute()
                print(f"  OK Inserted: {account_number}")
                inserted += 1

            success += 1

        except Exception as e:
            print(f"  X Error {account_number}: {e}")
            errors += 1

        # Progress update every 20 rows
        if (idx + 1) % 20 == 0:
            print(f"\n--- Progress: {idx + 1}/{len(df)} ---\n")

    print(f"\n{'='*60}")
    print(f"RESULTADO:")
    print(f"  Total processadas: {success}/{len(df)}")
    print(f"  Inseridas (novas): {inserted}")
    print(f"  Atualizadas: {updated}")
    if errors > 0:
        print(f"  Erros: {errors}")
    print(f"{'='*60}")

    print(f"\nImport completo!")
    print(f"Verifique no Supabase: {SUPABASE_URL}/project/_/editor")

if __name__ == "__main__":
    import_properties()
