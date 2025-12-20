"""
Create CSV with EXACT same format as the working 01_DADOS_206_PROPERTIES.csv
but with complete data from all steps
"""
import pandas as pd

# Load the complete data
df_complete = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv')

# Load the old working CSV to get exact column order
df_old = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_206_PROPERTIES.csv', nrows=1)

print(f"Complete CSV: {len(df_complete)} rows, {len(df_complete.columns)} columns")
print(f"Old working CSV columns: {len(df_old.columns)}")

# Get exact column order from old CSV
old_columns = df_old.columns.tolist()

print("\nOld CSV column order:")
for i, col in enumerate(old_columns, 1):
    print(f"  {i}. {col}")

# Create new dataframe with same column order
new_df = pd.DataFrame()

for col in old_columns:
    if col in df_complete.columns:
        new_df[col] = df_complete[col]
        print(f"[OK] Mapped: {col}")
    else:
        # Create empty column
        new_df[col] = ''
        print(f"[MISSING] {col} (filled with empty)")

print(f"\nFinal CSV: {len(new_df)} rows, {len(new_df.columns)} columns")

# Save with EXACT same format
output_path = 'Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv'
new_df.to_csv(output_path, index=False, encoding='utf-8')

print(f"\n[OK] CSV saved with exact format: {output_path}")
print(f"[OK] Columns: {len(new_df.columns)}")
print(f"[OK] Ready for Lovable import!")

# Verify
print("\nFirst row sample:")
sample = new_df.iloc[0][['account_number', 'property_address', 'owner_name', 'beds', 'baths']]
for key, val in sample.items():
    print(f"  {key}: {val}")
