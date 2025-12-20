"""
Add zip_code column to CSV by extracting from property_address
"""
import pandas as pd
import re

df = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv')

print(f"Original: {len(df)} rows, {len(df.columns)} columns")

# Extract ZIP from property_address
def extract_zip(address):
    if pd.isna(address):
        return '32801'  # Default

    # Look for 5-digit ZIP
    match = re.search(r'\b(\d{5})(?:-\d{4})?\b', str(address))
    if match:
        return match.group(1)

    return '32801'  # Default if not found

df['zip_code'] = df['property_address'].apply(extract_zip)

print(f"\nZIP codes extracted:")
print(df['zip_code'].value_counts())

# Reorder columns to put zip_code after state
cols = df.columns.tolist()

# Find index of mailing_state
if 'mailing_state' in cols:
    idx = cols.index('mailing_state')
    # Insert zip_code after mailing_state
    cols.remove('zip_code')
    cols.insert(idx + 1, 'zip_code')
    df = df[cols]

print(f"\nFinal: {len(df)} rows, {len(df.columns)} columns")
print(f"Columns now include zip_code at position: {cols.index('zip_code') + 1}")

# Save
output_path = 'Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv'
df.to_csv(output_path, index=False, encoding='utf-8')

print(f"\n[OK] CSV updated with zip_code column")
print(f"\nSample:")
print(df[['property_address', 'zip_code']].head(3))
