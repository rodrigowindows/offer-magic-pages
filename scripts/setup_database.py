"""
Setup Supabase Database - Create Tables and Permissions
"""

from supabase import create_client
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get credentials from .env
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

# SQL to create the table
CREATE_TABLE_SQL = """
-- Create priority_leads table
CREATE TABLE IF NOT EXISTS public.priority_leads (
    id BIGSERIAL PRIMARY KEY,
    account_number TEXT UNIQUE NOT NULL,
    priority_tier TEXT,
    owner_name TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    mailing_zip TEXT,
    property_address TEXT,
    lead_score INTEGER,
    condition_score INTEGER,
    condition_category TEXT,
    visual_summary TEXT,
    property_type TEXT,
    beds INTEGER,
    baths NUMERIC,
    year_built INTEGER,
    sqft INTEGER,
    lot_size INTEGER,
    just_value INTEGER,
    taxable_value INTEGER,
    exemptions TEXT,
    total_tax_due NUMERIC,
    years_delinquent INTEGER,
    is_estate BOOLEAN,
    is_out_of_state BOOLEAN,
    equity_estimate INTEGER,
    estimated_repair_cost_low INTEGER,
    estimated_repair_cost_high INTEGER,
    appears_vacant BOOLEAN,
    is_vacant_land BOOLEAN,
    lawn_condition TEXT,
    exterior_condition TEXT,
    roof_condition TEXT,
    visible_issues TEXT,
    distress_indicators TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_priority_tier ON public.priority_leads(priority_tier);
CREATE INDEX IF NOT EXISTS idx_lead_score ON public.priority_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_condition_score ON public.priority_leads(condition_score DESC);
"""

def main():
    print("="*80)
    print("SUPABASE DATABASE SETUP")
    print("="*80)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\nERROR: Missing Supabase credentials in .env file")
        print("Required variables:")
        print("  - VITE_SUPABASE_URL")
        print("  - VITE_SUPABASE_PUBLISHABLE_KEY")
        return

    print(f"\nConnecting to: {SUPABASE_URL}")

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected successfully")
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    print("\n" + "="*80)
    print("MANUAL SETUP REQUIRED")
    print("="*80)

    print("\nThe publishable key (anon key) cannot execute SQL directly.")
    print("You need to use the Supabase Dashboard to create the table.")

    print("\nSTEPS:")
    print("1. Go to: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql")
    print("2. Click '+ New query'")
    print("3. Copy the SQL from: setup_supabase_tables.sql")
    print("4. Paste it in the SQL Editor")
    print("5. Click 'Run' (or press Ctrl+Enter)")

    print("\n" + "="*80)
    print("ALTERNATIVE: Import CSV Directly")
    print("="*80)

    print("\nIf you prefer, you can import the CSV files directly:")
    print("1. Go to: https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/editor")
    print("2. Click 'New Table'")
    print("3. Name: priority_leads")
    print("4. Add columns (or let it auto-detect from CSV)")
    print("5. Click 'Import data from CSV'")
    print("6. Upload: ../Step 4 - AI Review & Evaluate/CONTACT_LISTS/CONTACT_LIST_FOCUSED.csv")

    print("\n" + "="*80)

if __name__ == "__main__":
    main()
