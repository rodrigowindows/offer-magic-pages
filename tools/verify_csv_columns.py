import pandas as pd

df = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv')

print('CSV Info:')
print(f'Rows: {len(df)}')
print(f'Columns: {len(df.columns)}')
print(f'Has account_number: {"account_number" in df.columns}')
print(f'Has property_address: {"property_address" in df.columns}')

print('\nFirst 3 column names (with repr):')
for i, col in enumerate(df.columns[:3], 1):
    print(f'{i}. {repr(col)}')

print('\nFirst row data:')
print(f'account_number: {repr(df.iloc[0]["account_number"])}')
print(f'property_address: {repr(df.iloc[0]["property_address"])}')

# Check for BOM or special characters
with open('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv', 'rb') as f:
    first_bytes = f.read(100)
    print(f'\nFirst bytes of file: {first_bytes[:50]}')
    if first_bytes.startswith(b'\xef\xbb\xbf'):
        print('BOM detected: UTF-8 with BOM')
    else:
        print('No BOM detected')
