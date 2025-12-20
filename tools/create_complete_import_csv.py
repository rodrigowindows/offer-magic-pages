"""
Create complete CSV with ALL columns from Steps 1, 2, and 4
Merges all data sources for complete Lovable import
"""

import pandas as pd
import os

def main():
    print("Loading data from all steps...")

    # Load Step 2 (has all Step 1 data + scores)
    step2_df = pd.read_csv("Step 2 - Score & Create Call List/SCORED_ENRICHED_LEADS.csv")
    print(f"Step 2: {len(step2_df)} rows, {len(step2_df.columns)} columns")

    # Load Step 4 (visual analysis)
    step4_df = pd.read_csv("Step 4 - AI Review & Evaluate/data/property_condition_analysis.csv")
    print(f"Step 4: {len(step4_df)} rows, {len(step4_df.columns)} columns")

    # Standardize Account Number columns - normalize format (replace - with _)
    step2_df['account_number'] = step2_df['Account Number'].str.strip().str.replace('-', '_')
    step4_df['account_number'] = step4_df['Account Number'].str.strip().str.replace('-', '_')

    # Merge Step 2 and Step 4
    print("\nMerging Step 2 and Step 4...")
    merged_df = pd.merge(
        step2_df,
        step4_df,
        on='account_number',
        how='inner',  # Only keep properties that have visual analysis
        suffixes=('', '_visual')
    )

    # Drop duplicate Account Number columns from merge - keep only the normalized account_number
    cols_to_drop = [col for col in merged_df.columns if col in ['Account Number', 'Account Number_visual']]
    if cols_to_drop:
        merged_df = merged_df.drop(columns=cols_to_drop)
        print(f"Dropped original Account Number columns: {cols_to_drop}")

    print(f"After merge: {len(merged_df)} rows, {len(merged_df.columns)} columns")

    # Filter to priority properties (SEVERE, POOR, FAIR, VACANT LAND)
    priority_categories = ['SEVERE', 'POOR', 'FAIR', 'VACANT LAND']
    priority_df = merged_df[merged_df['Condition_Category'].isin(priority_categories)].copy()

    print(f"\nPriority properties: {len(priority_df)} rows")
    print(f"  SEVERE: {len(priority_df[priority_df['Condition_Category'] == 'SEVERE'])}")
    print(f"  POOR: {len(priority_df[priority_df['Condition_Category'] == 'POOR'])}")
    print(f"  FAIR: {len(priority_df[priority_df['Condition_Category'] == 'FAIR'])}")
    print(f"  VACANT LAND: {len(priority_df[priority_df['Condition_Category'] == 'VACANT LAND'])}")

    # Remove duplicates by account_number
    print(f"\nBefore dedup: {len(priority_df)} rows")
    priority_df = priority_df.drop_duplicates(subset=['account_number'], keep='first')
    print(f"After dedup: {len(priority_df)} rows")

    # Add photo_url column
    STORAGE_BASE_URL = "https://lzowptxqnuundzhhqvko.supabase.co/storage/v1/object/public/property-images"

    def get_image_url(account_number):
        image_filename = str(account_number).replace('-', '_')
        # Check both original location and FINAL_PARA_IMPORT folder
        image_path1 = f"Step 3 - Download Images/downloaded_images/{image_filename}.jpg"
        image_path2 = f"Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/02_IMAGENS_206_FOTOS/{image_filename}.jpg"
        if os.path.exists(image_path1) or os.path.exists(image_path2):
            return f"{STORAGE_BASE_URL}/{image_filename}.jpg"
        return None

    priority_df['photo_url'] = priority_df['account_number'].apply(get_image_url)

    # Filter to only properties with images
    priority_df = priority_df[priority_df['photo_url'].notna()].copy()
    print(f"After filtering for images: {len(priority_df)} rows")

    # Rename columns to snake_case for database
    column_mapping = {
        'Account Number': 'account_number',
        'Owner Name': 'owner_name',
        'Owner Address': 'owner_address',
        'Property Address': 'property_address',
        'Balance Amount': 'balance_amount',
        'Assessed Value': 'assessed_value',
        'Roll Yr': 'roll_year',
        'Tax Yr': 'tax_year',
        'Alternate Key': 'alternate_key',
        'Account Status': 'account_status',
        'Billing Address': 'billing_address',
        'Legal Desc': 'legal_description',
        'Millage Code': 'millage_code',
        'Cert #': 'cert_number',
        'Bidder #': 'bidder_number',
        'Cert Buyer': 'cert_buyer',
        'Cert Status': 'cert_status',
        'Deed Status': 'deed_status',
        'Equity': 'equity',
        'Years Old': 'years_old',
        'Times Delinquent': 'times_delinquent',
        'Estate/Trust': 'is_estate_trust',
        'Out of State': 'is_out_of_state',
        'Deed Certified': 'is_deed_certified',
        'Cert Issued': 'is_cert_issued',
        'Is LLC': 'is_llc',
        'Score': 'priority_score',
        'Equity Ratio': 'equity_ratio',
        'Value Per Acre': 'value_per_acre',
        'Condition_Score': 'condition_score',
        'Condition_Category': 'condition_category',
        'Lawn_Condition': 'lawn_condition',
        'Exterior_Condition': 'exterior_condition',
        'Visible_Issues': 'visible_issues',
        'Appears_Vacant': 'appears_vacant',
        'Estimated_Repair_Cost': 'estimated_repair_cost',
        'Visual_Summary': 'visual_summary',
        'Roof_Condition': 'roof_condition',
        'Driveway_Condition': 'driveway_condition',
        'Pool_Condition': 'pool_condition',
        'Vehicles_Present': 'vehicles_present',
        'Distress_Indicators': 'distress_indicators',
        'Neighbor_Comparison': 'neighbor_comparison',
        'Estimated_Repair_Cost_Low': 'estimated_repair_cost_low',
        'Estimated_Repair_Cost_High': 'estimated_repair_cost_high',
        'Image_Appears_Current': 'image_appears_current',
        'Image_Path': 'image_path',
        'Analysis_Date': 'analysis_date'
    }

    # Apply mapping for columns that exist
    priority_df = priority_df.rename(columns={k: v for k, v in column_mapping.items() if k in priority_df.columns})

    # Select and order columns for import
    columns_order = [
        # Essential identifiers
        'account_number',
        'property_address',
        'owner_name',
        'owner_address',

        # Photo
        'photo_url',

        # Financial data
        'balance_amount',
        'assessed_value',
        'market_value_2025',
        'assessed_value_2025',
        'land_value_2025',
        'building_value_2025',
        'equity',
        'equity_ratio',

        # Property details
        'year_built',
        'years_old',
        'living_area_sqft',
        'gross_area_sqft',
        'bedrooms',
        'bathrooms',
        'floors',
        'building_type',
        'exterior_wall',
        'interior_wall',
        'land_use_code',
        'land_use_description',
        'zoning',
        'land_qty',
        'land_qty_code',
        'land_acres',
        'land_sqft',
        'value_per_acre',

        # Tax & legal
        'roll_year',
        'tax_year',
        'alternate_key',
        'account_status',
        'billing_address',
        'legal_description',
        'millage_code',
        'cert_number',
        'bidder_number',
        'cert_buyer',
        'cert_status',
        'deed_status',

        # Scoring & flags
        'priority_score',
        'times_delinquent',
        'is_estate_trust',
        'is_out_of_state',
        'is_deed_certified',
        'is_cert_issued',
        'is_llc',

        # Visual analysis
        'condition_score',
        'condition_category',
        'lawn_condition',
        'exterior_condition',
        'roof_condition',
        'driveway_condition',
        'pool_condition',
        'visible_issues',
        'appears_vacant',
        'vehicles_present',
        'distress_indicators',
        'neighbor_comparison',
        'visual_summary',
        'estimated_repair_cost',
        'estimated_repair_cost_low',
        'estimated_repair_cost_high',
        'image_appears_current',

        # Metadata
        'pid',
        'image_path',
        'analysis_date'
    ]

    # Only include columns that exist in the dataframe
    available_columns = [col for col in columns_order if col in priority_df.columns]
    final_df = priority_df[available_columns].copy()

    # Remove columns that are completely empty (100% null)
    null_percentages = final_df.isna().sum() / len(final_df) * 100
    empty_cols = null_percentages[null_percentages == 100].index.tolist()
    if empty_cols:
        print(f"\nRemoving {len(empty_cols)} empty columns: {empty_cols}")
        final_df = final_df.drop(columns=empty_cols)

    print(f"\nFinal dataset: {len(final_df)} rows, {len(final_df.columns)} columns")
    print(f"\nColumn list ({len(final_df.columns)} total):")
    for i, col in enumerate(final_df.columns, 1):
        print(f"  {i}. {col}")

    # Save to FINAL_PARA_IMPORT folder
    output_path = "Step 5 - Outreach & Campaigns/FINAL_PARA_IMPORT/01_DADOS_COMPLETO_TODAS_COLUNAS.csv"
    final_df.to_csv(output_path, index=False, encoding='utf-8-sig')

    print(f"\n[OK] Complete CSV saved to: {output_path}")
    print(f"[OK] Ready for Lovable import!")

    # Show sample data
    print("\nSample data (first 2 rows):")
    print(final_df.head(2).T)

if __name__ == "__main__":
    main()
