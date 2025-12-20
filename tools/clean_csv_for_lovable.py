"""
Clean CSV for Lovable - ensure no empty values in critical columns
"""
import pandas as pd
import numpy as np

# Read CSV
df = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv')

print(f"Original: {len(df)} rows, {len(df.columns)} columns")

# Check for empty column names
empty_cols = [col for col in df.columns if col == '' or str(col).strip() == '']
if empty_cols:
    print(f"\nWARNING: Found {len(empty_cols)} empty column names!")
    df = df.drop(columns=empty_cols)
    print(f"Removed empty columns. Now: {len(df.columns)} columns")

# Check for empty account_number or property_address
print("\nChecking critical columns:")
print(f"  account_number: {df['account_number'].isna().sum()} null, {(df['account_number'] == '').sum()} empty")
print(f"  property_address: {df['property_address'].isna().sum()} null, {(df['property_address'] == '').sum()} empty")

# Remove rows with empty account_number or property_address
original_count = len(df)
df = df[df['account_number'].notna() & (df['account_number'] != '')]
df = df[df['property_address'].notna() & (df['property_address'] != '')]
removed = original_count - len(df)
if removed > 0:
    print(f"\nRemoved {removed} rows with empty account_number or property_address")

# Replace all NaN and empty strings with appropriate defaults
print("\nCleaning empty values...")

# For text columns, replace NaN with empty string
text_columns = df.select_dtypes(include=['object']).columns
for col in text_columns:
    df[col] = df[col].fillna('')

# For numeric columns, keep NaN as is (Lovable can handle this)
# Just ensure no empty strings in numeric columns
numeric_columns = df.select_dtypes(include=[np.number]).columns
print(f"  Text columns: {len(text_columns)}")
print(f"  Numeric columns: {len(numeric_columns)}")

# Ensure account_number is clean (no hyphens, consistent format)
df['account_number'] = df['account_number'].str.replace('-', '_')

print(f"\nFinal: {len(df)} rows, {len(df.columns)} columns")

# Save cleaned CSV
output_path = 'Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv'
df.to_csv(output_path, index=False, encoding='utf-8')

print(f"\n[OK] Cleaned CSV saved: {output_path}")

# Show sample
print("\nSample row (first 5 columns):")
for col in df.columns[:5]:
    print(f"  {col}: {repr(df.iloc[0][col])}")
