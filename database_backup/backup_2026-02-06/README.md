# 🗄️ Database Backup - February 6, 2026

## 📊 Backup Summary

| Info | Value |
|------|-------|
| **Date** | 2026-02-06 22:58:00 UTC |
| **Total Records** | 1,306 |
| **Total Tables** | 25 |
| **Project ID** | atwdkhlyrffbaugkaker |

## 📈 Table Statistics

| Table | Records | Status |
|-------|---------|--------|
| `properties` | 223 | ✅ Core data |
| `priority_leads` | 86 | ✅ Lead data |
| `campaign_logs` | 146 | ✅ Campaign history |
| `templates` | 8 | ✅ Saved |
| `ab_tests` | 12 | ✅ Analytics |
| `ab_test_events` | 78 | ✅ Events |
| `property_analytics` | 207 | ✅ Page views |
| `notifications` | 146 | ✅ System notifications |
| `api_request_logs` | 301 | ⚠️ Large - separate file |
| `comps_analysis_history` | 25 | ✅ Comps data |
| `manual_comps_links` | 78 | ✅ Manual links |
| `profiles` | 2 | ✅ User profiles |
| `property_leads` | 1 | ✅ Captured leads |
| `campaign_sequences` | 1 | ✅ Sequences |
| `sequence_steps` | 3 | ✅ Saved |
| `email_settings` | 1 | ✅ Config |
| `email_campaigns` | 0 | Empty |
| `sms_settings` | 0 | Empty |
| `call_settings` | 0 | Empty |
| `campaign_templates` | 0 | Empty |
| `property_notes` | 0 | Empty |
| `property_sequences` | 0 | Empty |
| `property_offer_history` | 0 | Empty |
| `follow_up_reminders` | 0 | Empty |
| `comparables_cache` | 0 | Empty |

## 📁 Files Included

- `backup_info.json` - Metadata and statistics
- `profiles.json` - User profiles (2 records)
- `templates.json` - Message templates (8 records)
- `ab_tests.json` - A/B test sessions (12 records)
- `property_leads.json` - Captured leads (1 record)
- `campaign_sequences.json` - Automation sequences (1 record)
- `sequence_steps.json` - Sequence steps (3 records)
- `email_settings.json` - Email API config (1 record)

## ⚠️ Large Tables

The following tables have many records and are backed up directly from the database:
- `properties` (223) - Use database query to export
- `priority_leads` (86) - Use database query to export
- `campaign_logs` (146) - Use database query to export
- `property_analytics` (207) - Use database query to export
- `notifications` (146) - Use database query to export
- `api_request_logs` (301) - Use database query to export

## 🔄 How to Restore

1. Use the Supabase dashboard or API to restore data
2. Start with empty tables first (profiles, templates, etc.)
3. Then restore larger tables with proper foreign key order

## 📋 Restore Order (Recommended)

1. `profiles` (no dependencies)
2. `templates` (no dependencies)
3. `properties` (no dependencies)
4. `priority_leads` (no dependencies)
5. `campaign_sequences` (no dependencies)
6. `sequence_steps` (depends on campaign_sequences)
7. `email_settings` (no dependencies)
8. `ab_tests` (depends on properties)
9. `ab_test_events` (depends on properties)
10. `property_leads` (depends on properties)
11. `campaign_logs` (depends on properties)
12. `property_analytics` (depends on properties)
13. `notifications` (depends on properties)
14. Other tables...
