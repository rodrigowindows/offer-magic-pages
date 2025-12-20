"""
Prepare data for manual upload to Supabase
Creates a single CSV file optimized for Supabase import
"""

import pandas as pd
from pathlib import Path

# Paths
CONTACT_LIST = Path("../Step 4 - AI Review & Evaluate/CONTACT_LISTS/CONTACT_LIST_FOCUSED.csv")
LAND_LIST = Path("../Step 4 - AI Review & Evaluate/CONTACT_LISTS/VACANT_LAND/VACANT_LAND_PRIORITY.csv")
OUTPUT_FILE = Path("SUPABASE_UPLOAD_242_LEADS.csv")

def prepare_data():
    print("="*80)
    print("PREPARING DATA FOR SUPABASE MANUAL UPLOAD")
    print("="*80)

    # Load properties
    print(f"\nLoading properties from: {CONTACT_LIST}")
    df_properties = pd.read_csv(CONTACT_LIST)
    print(f"Loaded {len(df_properties)} properties")

    # Load land
    print(f"\nLoading land from: {LAND_LIST}")
    df_land = pd.read_csv(LAND_LIST)
    print(f"Loaded {len(df_land)} land parcels")

    # Combine
    df_all = pd.concat([df_properties, df_land], ignore_index=True)
    print(f"\nTotal leads: {len(df_all)}")

    # Rename columns to match Supabase schema (snake_case)
    column_mapping = {
        'Account Number': 'account_number',
        'Priority': 'priority_tier',
        'Owner': 'owner_name',
        'Mailing Address': 'mailing_address',
        'Mailing City': 'mailing_city',
        'Mailing State': 'mailing_state',
        'Mailing Zip': 'mailing_zip',
        'Property Address': 'property_address',
        'Lead Score': 'lead_score',
        'Condition_Score': 'condition_score',
        'Condition_Category': 'condition_category',
        'Visual_Summary': 'visual_summary',
        'Property Type': 'property_type',
        'Beds': 'beds',
        'Baths': 'baths',
        'Year Built': 'year_built',
        'SqFt': 'sqft',
        'Lot Size': 'lot_size',
        'Just Value': 'just_value',
        'Taxable Value': 'taxable_value',
        'Exemptions': 'exemptions',
        'Total Tax Due': 'total_tax_due',
        'Years Delinquent': 'years_delinquent',
        'Is Estate': 'is_estate',
        'Is Out of State': 'is_out_of_state',
        'Equity Estimate': 'equity_estimate',
        'Estimated_Repair_Cost_Low': 'estimated_repair_cost_low',
        'Estimated_Repair_Cost_High': 'estimated_repair_cost_high',
        'Appears_Vacant': 'appears_vacant',
        'Is_Vacant_Land': 'is_vacant_land',
        'Lawn_Condition': 'lawn_condition',
        'Exterior_Condition': 'exterior_condition',
        'Roof_Condition': 'roof_condition',
        'Visible_Issues': 'visible_issues',
        'Distress_Indicators': 'distress_indicators'
    }

    # Rename columns that exist
    df_all = df_all.rename(columns=column_mapping)

    # Add image_url column (will be populated after image upload)
    df_all['image_url'] = ''

    # Select only columns that match our schema
    schema_columns = [
        'account_number', 'priority_tier', 'owner_name',
        'mailing_address', 'mailing_city', 'mailing_state', 'mailing_zip',
        'property_address', 'lead_score', 'condition_score', 'condition_category',
        'visual_summary', 'property_type', 'beds', 'baths', 'year_built',
        'sqft', 'lot_size', 'just_value', 'taxable_value', 'exemptions',
        'total_tax_due', 'years_delinquent', 'is_estate', 'is_out_of_state',
        'equity_estimate', 'estimated_repair_cost_low', 'estimated_repair_cost_high',
        'appears_vacant', 'is_vacant_land', 'lawn_condition', 'exterior_condition',
        'roof_condition', 'visible_issues', 'distress_indicators', 'image_url'
    ]

    # Keep only columns that exist
    existing_columns = [col for col in schema_columns if col in df_all.columns]
    df_output = df_all[existing_columns].copy()

    # Fill missing columns with defaults
    for col in schema_columns:
        if col not in df_output.columns:
            df_output[col] = None

    # Save to CSV
    print(f"\nSaving to: {OUTPUT_FILE}")
    df_output.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved {len(df_output)} rows")

    # Show summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"\nFile created: {OUTPUT_FILE.absolute()}")
    print(f"Total rows: {len(df_output)}")
    print(f"Total columns: {len(df_output.columns)}")

    print("\nPriority breakdown:")
    if 'priority_tier' in df_output.columns:
        priority_counts = df_output['priority_tier'].value_counts().sort_index()
        for priority, count in priority_counts.items():
            print(f"  {priority}: {count}")

    print("\n" + "="*80)
    print("NEXT STEPS")
    print("="*80)
    print("\n1. Go to Supabase Dashboard:")
    print("   https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor")

    print("\n2. Create the table using SQL Editor:")
    print("   - Click 'SQL Editor' in sidebar")
    print("   - Run the SQL from: setup_supabase_tables.sql")

    print("\n3. Import the CSV:")
    print("   - Go to 'Table Editor'")
    print("   - Click on 'priority_leads' table")
    print("   - Click 'Insert' > 'Import data from CSV'")
    print(f"   - Select file: {OUTPUT_FILE.absolute()}")

    print("\n" + "="*80)

if __name__ == "__main__":
    prepare_data()
