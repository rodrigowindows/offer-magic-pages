"""
Add all required columns for Supabase with default values
"""
import pandas as pd

df = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv')

print(f"Original: {len(df)} rows, {len(df.columns)} columns")
print(f"Columns: {list(df.columns[:20])}")

# Add city if not exists
if 'city' not in df.columns:
    df['city'] = 'Orlando'
    print("Added 'city' column")

# Add state if not exists
if 'state' not in df.columns:
    df['state'] = 'FL'
    print("Added 'state' column")

# Add cash_offer_amount based on just_value or estimated value
if 'cash_offer_amount' not in df.columns:
    if 'just_value' in df.columns:
        df['cash_offer_amount'] = df['just_value'].fillna(100000) * 0.7
    elif 'assessed_value' in df.columns:
        df['cash_offer_amount'] = df['assessed_value'].fillna(100000) * 0.7
    else:
        df['cash_offer_amount'] = 70000

    df['cash_offer_amount'] = df['cash_offer_amount'].fillna(70000).astype(int)
    print("Added 'cash_offer_amount' column")

# Make sure estimated_value exists
if 'estimated_value' not in df.columns:
    if 'just_value' in df.columns:
        df['estimated_value'] = df['just_value'].fillna(100000)
    elif 'assessed_value' in df.columns:
        df['estimated_value'] = df['assessed_value'].fillna(100000)
    else:
        df['estimated_value'] = 100000

    df['estimated_value'] = df['estimated_value'].fillna(100000).astype(int)
    print("Added 'estimated_value' column")

print(f"\nFinal: {len(df)} rows, {len(df.columns)} columns")
print(f"\nSample values:")
print(df[['property_address', 'city', 'state', 'zip_code', 'estimated_value', 'cash_offer_amount']].head(3))

# Save
output_path = 'Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv'
df.to_csv(output_path, index=False, encoding='utf-8')

print(f"\n[OK] CSV updated with required columns")
