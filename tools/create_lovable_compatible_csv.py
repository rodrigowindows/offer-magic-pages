"""
Create Lovable-compatible CSV with all data
Maps column names to what Lovable expects + adds all extra columns
"""

import pandas as pd

def main():
    print("Loading complete CSV...")
    df = pd.read_csv('Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv')
    print(f"Loaded: {len(df)} rows, {len(df.columns)} columns")

    # Create new columns with Lovable-compatible names
    lovable_df = df.copy()

    # Map bedrooms -> beds, bathrooms -> baths
    if 'bedrooms' in df.columns:
        lovable_df['beds'] = df['bedrooms']
    if 'bathrooms' in df.columns:
        lovable_df['baths'] = df['bathrooms']

    # Map living_area_sqft -> sqft
    if 'living_area_sqft' in df.columns:
        lovable_df['sqft'] = df['living_area_sqft']
    elif 'gross_area_sqft' in df.columns:
        lovable_df['sqft'] = df['gross_area_sqft']

    # Map land_acres -> lot_size (convert acres to sqft: 1 acre = 43,560 sqft)
    if 'land_sqft' in df.columns:
        lovable_df['lot_size'] = df['land_sqft']
    elif 'land_acres' in df.columns:
        lovable_df['lot_size'] = df['land_acres'] * 43560

    # Add mailing address from owner_address
    if 'owner_address' in df.columns:
        # Parse owner_address: "211 LONGLEAF CT ORLANDO, FL 32835-1051"
        def parse_mailing_address(addr):
            if pd.isna(addr):
                return {'mailing_address': '', 'mailing_city': '', 'mailing_state': 'FL', 'mailing_zip': ''}

            parts = str(addr).split(',')
            street = parts[0].strip() if len(parts) > 0 else ''

            city = ''
            state = 'FL'
            zip_code = ''

            if len(parts) > 1:
                # "ORLANDO, FL 32835-1051" or just "FL 32835-1051"
                city_state_zip = parts[-1].strip()
                tokens = city_state_zip.split()

                for token in tokens:
                    if len(token) == 2 and token.isalpha():
                        state = token
                    elif token[0].isdigit():
                        zip_code = token.split('-')[0]  # Remove -1051 extension
                    else:
                        city += token + ' '

                city = city.strip()

                # If no city found, try from second-to-last part
                if not city and len(parts) > 2:
                    city = parts[-2].strip()

            return {
                'mailing_address': street,
                'mailing_city': city,
                'mailing_state': state,
                'mailing_zip': zip_code
            }

        mailing_data = df['owner_address'].apply(parse_mailing_address)
        lovable_df['mailing_address'] = [m['mailing_address'] for m in mailing_data]
        lovable_df['mailing_city'] = [m['mailing_city'] for m in mailing_data]
        lovable_df['mailing_state'] = [m['mailing_state'] for m in mailing_data]
        lovable_df['mailing_zip'] = [m['mailing_zip'] for m in mailing_data]

    # Add property_type from building_type or land_use_description
    if 'building_type' in df.columns:
        lovable_df['property_type'] = df['building_type']
    elif 'land_use_description' in df.columns:
        lovable_df['property_type'] = df['land_use_description']
    else:
        lovable_df['property_type'] = 'Single Family'

    # Add just_value (use assessed_value or market_value)
    if 'assessed_value' in df.columns:
        lovable_df['just_value'] = df['assessed_value']

    # Add taxable_value (same as assessed)
    if 'assessed_value' in df.columns:
        lovable_df['taxable_value'] = df['assessed_value']

    # Add exemptions (placeholder)
    lovable_df['exemptions'] = ''

    # Add total_tax_due from balance_amount
    if 'balance_amount' in df.columns:
        lovable_df['total_tax_due'] = df['balance_amount']

    # Map times_delinquent -> years_delinquent
    if 'times_delinquent' in df.columns:
        lovable_df['years_delinquent'] = df['times_delinquent']

    # Map priority_score -> lead_score
    if 'priority_score' in df.columns:
        lovable_df['lead_score'] = df['priority_score']

    # Add priority_tier based on condition_category
    def get_priority_tier(category):
        if pd.isna(category):
            return 'P4-MODERATE'
        if category == 'SEVERE':
            return 'P1-CRITICAL'
        elif category == 'POOR':
            return 'P2-HIGH'
        elif category == 'FAIR':
            return 'P3-GOOD'
        elif category == 'VACANT LAND':
            return 'P4-LAND'
        return 'P4-MODERATE'

    if 'condition_category' in df.columns:
        lovable_df['priority_tier'] = df['condition_category'].apply(get_priority_tier)

    # Map equity -> equity_estimate
    if 'equity' in df.columns:
        lovable_df['equity_estimate'] = df['equity']

    # Map is_estate_trust -> is_estate
    if 'is_estate_trust' in df.columns:
        lovable_df['is_estate'] = df['is_estate_trust']

    # Add is_vacant_land based on condition_category
    if 'condition_category' in df.columns:
        lovable_df['is_vacant_land'] = df['condition_category'] == 'VACANT LAND'

    # Define column order (Lovable expected columns first, then all extras)
    lovable_columns = [
        # Required/Expected by Lovable
        'account_number',
        'property_address',
        'photo_url',

        # Condition analysis
        'condition_score',
        'condition_category',
        'visual_summary',
        'appears_vacant',
        'lawn_condition',
        'exterior_condition',
        'roof_condition',
        'visible_issues',

        # Owner info
        'owner_name',
        'mailing_address',
        'mailing_city',
        'mailing_state',
        'mailing_zip',

        # Property details
        'property_type',
        'beds',
        'baths',
        'year_built',
        'sqft',
        'lot_size',

        # Financial
        'just_value',
        'taxable_value',
        'exemptions',
        'total_tax_due',
        'years_delinquent',

        # Scoring
        'lead_score',
        'priority_tier',
        'equity_estimate',
        'estimated_repair_cost_low',
        'estimated_repair_cost_high',

        # Flags
        'is_estate',
        'is_out_of_state',
        'is_vacant_land',
        'distress_indicators',
    ]

    # Add all remaining columns from the complete CSV
    all_columns = lovable_columns.copy()
    for col in lovable_df.columns:
        if col not in all_columns:
            all_columns.append(col)

    # Only keep columns that exist
    final_columns = [col for col in all_columns if col in lovable_df.columns]

    # Create final dataframe
    final_df = lovable_df[final_columns].copy()

    print(f"\nFinal dataset: {len(final_df)} rows, {len(final_df.columns)} columns")
    print(f"\nFirst 36 columns (Lovable-compatible):")
    for i, col in enumerate(final_df.columns[:36], 1):
        print(f"  {i}. {col}")

    print(f"\nAdditional columns ({len(final_df.columns) - 36}):")
    for i, col in enumerate(final_df.columns[36:], 37):
        print(f"  {i}. {col}")

    # Save
    output_path = "Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv"
    final_df.to_csv(output_path, index=False, encoding='utf-8')

    print(f"\n[OK] Lovable-compatible CSV saved: {output_path}")
    print(f"[OK] Total columns: {len(final_df.columns)}")
    print(f"[OK] Ready for import!")

    # Sample data
    print("\nSample row:")
    sample = final_df.iloc[0][['account_number', 'property_address', 'owner_name', 'beds', 'baths', 'sqft', 'mailing_city']]
    for key, val in sample.items():
        print(f"  {key}: {val}")

if __name__ == "__main__":
    main()
