import pandas as pd

df = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv')

print(f'Total rows: {len(df)}')
print(f'Total columns: {len(df.columns)}')

# Check for duplicate column names
dup_cols = df.columns[df.columns.duplicated()].tolist()
if dup_cols:
    print(f'\nDUPLICATE COLUMNS: {dup_cols}')
else:
    print('\nNo duplicate columns')

# Check for columns with high null percentage
print('\nColumns with >50% null values:')
high_null_cols = []
for col in df.columns:
    null_pct = df[col].isna().sum() / len(df) * 100
    if null_pct > 50:
        high_null_cols.append((col, null_pct))
        print(f'  {col}: {null_pct:.1f}% null')

if not high_null_cols:
    print('  None')

# Show data quality summary
print(f'\nData quality:')
print(f'  - Unique account numbers: {df["account_number"].nunique()}')
print(f'  - Properties with photo_url: {df["photo_url"].notna().sum()}')
print(f'  - Condition categories: {df["condition_category"].value_counts().to_dict()}')
