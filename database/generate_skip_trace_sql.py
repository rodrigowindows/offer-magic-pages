#!/usr/bin/env python3
"""
Generate SQL UPDATE statements from BatchSkipTracing CSV export.

Reads: /home/user/offer-magic-pages/database/skip_trace_full.csv
Outputs: SQL to stdout (pipe to a .sql file)

CSV rows are grouped by UUID ("Input Custom Field 1").
- 1st row per UUID = Person 1 (primary owner)
- 2nd row per UUID = Person 2
- 3rd row per UUID = Person 3

Usage:
    python3 generate_skip_trace_sql.py > skip_trace_update.sql
"""

import csv
import json
import sys
from collections import OrderedDict
from datetime import datetime, timezone

CSV_PATH = "/home/user/offer-magic-pages/database/skip_trace_full.csv"


def sql_escape(value):
    """Escape a string value for SQL single-quoted literals."""
    if value is None:
        return None
    return value.replace("'", "''")


def val(row, key):
    """Get a trimmed string value from a row, or None if empty."""
    v = row.get(key, "")
    if v is None:
        return None
    v = v.strip()
    return v if v else None


def val_int(row, key):
    """Get an integer value from a row, or None."""
    v = val(row, key)
    if v is None:
        return None
    try:
        return int(v)
    except (ValueError, TypeError):
        return None


def val_bool_deceased(row, key="Deceased"):
    """Deceased: 'Y' -> True, else False."""
    v = val(row, key)
    return v == "Y"


def val_bool_dnc(row, key="DNC/Litigator Scrub"):
    """DNC: 'DNC' -> True, else False."""
    v = val(row, key)
    return v == "DNC"


def get_phones(row, prefix=""):
    """Extract phone1-7 and their types from a row."""
    phones = []
    for i in range(1, 8):
        phone = val(row, f"{prefix}Phone{i}")
        phone_type = val(row, f"{prefix}Phone{i} Type")
        if phone:
            phones.append({"number": phone, "type": phone_type or "Unknown"})
    return phones


def get_best_phone(phones):
    """Return the best phone: prefer Mobile, then Residential, then any."""
    for p in phones:
        if p["type"] == "Mobile" and p["number"]:
            return p["number"]
    for p in phones:
        if p["type"] == "Residential" and p["number"]:
            return p["number"]
    for p in phones:
        if p["number"]:
            return p["number"]
    return None


def sql_text(value):
    """Format a text value for SQL: 'escaped_value' or skip."""
    if value is None:
        return None
    return f"'{sql_escape(value)}'"


def sql_int(value):
    """Format an integer value for SQL."""
    if value is None:
        return None
    return str(value)


def sql_bool(value):
    """Format a boolean value for SQL."""
    if value is None:
        return None
    return "true" if value else "false"


def sql_json(obj):
    """Format a JSON object for SQL."""
    return f"'{sql_escape(json.dumps(obj))}'::jsonb"


def build_person1_columns(row):
    """Build column assignments for Person 1 (primary owner) from a CSV row."""
    cols = OrderedDict()

    # Matched name
    first_name = val(row, "Matched First Name")
    last_name = val(row, "Matched Last Name")
    cols["matched_first_name"] = sql_text(first_name)
    cols["matched_last_name"] = sql_text(last_name)

    # Result code
    cols["resultcode"] = sql_text(val(row, "ResultCode"))

    # Input fields
    cols["input_first_name"] = sql_text(val(row, "Input First Name"))
    cols["input_last_name"] = sql_text(val(row, "Input Last Name"))
    cols["input_mailing_address"] = sql_text(val(row, "Input Mailing Address"))
    cols["input_mailing_city"] = sql_text(val(row, "Input Mailing City"))
    cols["input_mailing_state"] = sql_text(val(row, "Input Mailing State"))
    cols["input_mailing_zip"] = sql_text(val(row, "Input Mailing Zip"))
    cols["input_property_address"] = sql_text(val(row, "Input Property Address"))
    cols["input_property_city"] = sql_text(val(row, "Input Property City"))
    cols["input_property_state"] = sql_text(val(row, "Input Property State"))
    cols["input_property_zip"] = sql_text(val(row, "Input Property Zip"))

    # Owner Fix fields
    cols["owner_fix_first_name"] = sql_text(val(row, "Owner Fix - First Name"))
    cols["owner_fix_last_name"] = sql_text(val(row, "Owner Fix - Last Name"))
    cols["owner_fix_mailing_address"] = sql_text(val(row, "Owner Fix - Mailing Address"))
    cols["owner_fix_mailing_city"] = sql_text(val(row, "Owner Fix - Mailing City"))
    cols["owner_fix_mailing_state"] = sql_text(val(row, "Owner Fix - Mailing State"))
    cols["owner_fix_mailing_zip"] = sql_text(val(row, "Owner Fix - Mailing Zip"))

    # Age, deceased, DNC
    cols["age"] = sql_int(val_int(row, "Age"))
    cols["deceased"] = sql_bool(val_bool_deceased(row))
    cols["dnc_flag"] = sql_bool(val_bool_dnc(row))
    cols["dnc_litigator_scrub"] = sql_text(val(row, "DNC/Litigator Scrub"))

    # Phones 1-7
    for i in range(1, 8):
        cols[f"phone{i}"] = sql_text(val(row, f"Phone{i}"))
        cols[f"phone{i}_type"] = sql_text(val(row, f"Phone{i} Type"))

    # Emails
    cols["email1"] = sql_text(val(row, "Email1"))
    cols["email2"] = sql_text(val(row, "Email2"))

    # Confirmed mailing address
    cols["confirmed_mailing_address"] = sql_text(val(row, "Confirmed Mailing Address"))
    cols["confirmed_mailing_city"] = sql_text(val(row, "Confirmed Mailing City"))
    cols["confirmed_mailing_state"] = sql_text(val(row, "Confirmed Mailing State"))
    cols["confirmed_mailing_zip"] = sql_text(val(row, "Confirmed Mailing Zip"))

    # Relatives 1-5
    for i in range(1, 6):
        cols[f"relative{i}_name"] = sql_text(val(row, f"Relative{i} Name"))
        cols[f"relative{i}_age"] = sql_int(val_int(row, f"Relative{i} Age"))
        for j in range(1, 6):
            cols[f"relative{i}_phone{j}"] = sql_text(val(row, f"Relative{i} Phone{j}"))
            cols[f"relative{i}_phone{j}_type"] = sql_text(val(row, f"Relative{i} Phone{j} Type"))

    # owner_name from matched name
    if first_name and last_name:
        cols["owner_name"] = sql_text(f"{first_name} {last_name}")
    elif first_name:
        cols["owner_name"] = sql_text(first_name)
    elif last_name:
        cols["owner_name"] = sql_text(last_name)

    # owner_phone = best phone
    phones = get_phones(row)
    best_phone = get_best_phone(phones)
    if best_phone:
        cols["owner_phone"] = sql_text(best_phone)

    # skip_tracing_data JSON
    result_code = val(row, "ResultCode")
    is_dnc = val_bool_dnc(row)
    is_deceased = val_bool_deceased(row)
    age = val_int(row, "Age")
    email1 = val(row, "Email1")
    email2 = val(row, "Email2")
    emails = [e for e in [email1, email2] if e]

    skip_data = {
        "firstName": first_name,
        "lastName": last_name,
        "age": age,
        "isDNC": is_dnc,
        "isDeceased": is_deceased,
        "resultCode": result_code,
        "phones": [{"number": p["number"], "type": p["type"]} for p in phones],
        "emails": emails,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    cols["skip_tracing_data"] = sql_json(skip_data)

    return cols, is_dnc, is_deceased


def build_person_n_columns(row, person_num):
    """Build column assignments for Person 2 or Person 3 from inline CSV columns.

    The CSV has Person2/Person3 data INLINE in the same row as Person 1.
    CSV columns: "Person2 First Name", "Person2 Phone1", "Person2 Relative1 Name", etc.
    DB columns: person2_first_name, person2_phone1, person2_relative1_name, etc.
    """
    csv_prefix = f"Person{person_num} "
    db_prefix = f"person{person_num}_"
    cols = OrderedDict()

    first_name = val(row, f"{csv_prefix}First Name")
    last_name = val(row, f"{csv_prefix}Last Name")
    cols[f"{db_prefix}first_name"] = sql_text(first_name)
    cols[f"{db_prefix}last_name"] = sql_text(last_name)
    cols[f"{db_prefix}age"] = sql_int(val_int(row, f"{csv_prefix}Age"))
    cols[f"{db_prefix}deceased"] = sql_bool(val(row, f"{csv_prefix}Deceased") == "Y")

    # Phones 1-7
    for i in range(1, 8):
        cols[f"{db_prefix}phone{i}"] = sql_text(val(row, f"{csv_prefix}Phone{i}"))
        cols[f"{db_prefix}phone{i}_type"] = sql_text(val(row, f"{csv_prefix}Phone{i} Type"))

    # Emails
    cols[f"{db_prefix}email1"] = sql_text(val(row, f"{csv_prefix}Email1"))
    cols[f"{db_prefix}email2"] = sql_text(val(row, f"{csv_prefix}Email2"))

    # Confirmed mailing
    cols[f"{db_prefix}confirmed_mailing_address"] = sql_text(val(row, f"{csv_prefix}Confirmed Mailing Address"))
    cols[f"{db_prefix}confirmed_mailing_city"] = sql_text(val(row, f"{csv_prefix}Confirmed Mailing City"))
    cols[f"{db_prefix}confirmed_mailing_state"] = sql_text(val(row, f"{csv_prefix}Confirmed Mailing State"))
    cols[f"{db_prefix}confirmed_mailing_zip"] = sql_text(val(row, f"{csv_prefix}Confirmed Mailing Zip"))

    # Relatives 1-5
    for i in range(1, 6):
        cols[f"{db_prefix}relative{i}_name"] = sql_text(val(row, f"{csv_prefix}Relative{i} Name"))
        cols[f"{db_prefix}relative{i}_age"] = sql_int(val_int(row, f"{csv_prefix}Relative{i} Age"))
        for j in range(1, 6):
            cols[f"{db_prefix}relative{i}_phone{j}"] = sql_text(val(row, f"{csv_prefix}Relative{i} Phone{j}"))
            cols[f"{db_prefix}relative{i}_phone{j}_type"] = sql_text(val(row, f"{csv_prefix}Relative{i} Phone{j} Type"))

    return cols


def generate_sql_for_property(uuid, rows):
    """Generate a single UPDATE statement for a property UUID."""
    lines = []
    lines.append(f"-- Property: {uuid}")

    all_cols = OrderedDict()
    is_dnc = False
    is_deceased = False

    # Person 1 (first row)
    row = rows[0]
    if len(rows) >= 1:
        p1_cols, is_dnc, is_deceased = build_person1_columns(row)
        all_cols.update(p1_cols)

    # Person 2 (inline in same row)
    if val(row, "Person2 First Name") or val(row, "Person2 Last Name"):
        p2_cols = build_person_n_columns(row, 2)
        all_cols.update(p2_cols)

    # Person 3 (inline in same row)
    if val(row, "Person3 First Name") or val(row, "Person3 Last Name"):
        p3_cols = build_person_n_columns(row, 3)
        all_cols.update(p3_cols)

    # Filter out None values (don't set columns to NULL)
    filtered_cols = OrderedDict()
    for k, v in all_cols.items():
        if v is not None:
            filtered_cols[k] = v

    if not filtered_cols:
        lines.append(f"-- SKIPPED: No data to update for {uuid}")
        return "\n".join(lines)

    # Build the SET clause
    set_parts = []
    for col, value in filtered_cols.items():
        set_parts.append(f"    {col} = {value}")

    # Tags: add DNC and/or Deceased without duplicates using array_cat + array_remove
    tag_additions = []
    if is_dnc:
        tag_additions.append("DNC")
    if is_deceased:
        tag_additions.append("Deceased")

    if tag_additions:
        # Build a tags expression that adds tags without duplicates
        # Start with COALESCE(tags, '{}')
        tags_expr = "COALESCE(tags, '{}'::text[])"
        for tag in tag_additions:
            # Remove then add to avoid duplicates
            tags_expr = f"array_cat(array_remove({tags_expr}, '{tag}'), ARRAY['{tag}'])"
        set_parts.append(f"    tags = {tags_expr}")

    # Always update updated_at
    set_parts.append("    updated_at = NOW()")

    escaped_uuid = sql_escape(uuid)
    lines.append(f"UPDATE properties SET")
    lines.append(",\n".join(set_parts))
    lines.append(f"WHERE id = '{escaped_uuid}';")

    return "\n".join(lines)


def main():
    # Read CSV
    try:
        with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
    except FileNotFoundError:
        print(f"-- ERROR: CSV file not found at {CSV_PATH}", file=sys.stderr)
        print(f"-- Please save the CSV file to: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"-- ERROR reading CSV: {e}", file=sys.stderr)
        sys.exit(1)

    if not rows:
        print("-- No data rows found in CSV", file=sys.stderr)
        sys.exit(1)

    # Group rows by UUID (Input Custom Field 1)
    # Maintain insertion order
    grouped = OrderedDict()
    skipped_no_uuid = 0

    for row in rows:
        uuid = val(row, "Input Custom Field 1")
        if not uuid:
            skipped_no_uuid += 1
            continue
        if uuid not in grouped:
            grouped[uuid] = []
        grouped[uuid].append(row)

    # Output SQL
    print("-- =============================================================================")
    print("-- Skip Trace Data Import - Generated SQL")
    print(f"-- Generated: {datetime.now(timezone.utc).isoformat()}")
    print(f"-- Source: {CSV_PATH}")
    print(f"-- Total CSV rows: {len(rows)}")
    print(f"-- Unique properties (UUIDs): {len(grouped)}")
    print(f"-- Rows skipped (no UUID): {skipped_no_uuid}")
    print("-- =============================================================================")
    print()
    print("BEGIN;")
    print()

    count = 0
    for uuid, property_rows in grouped.items():
        sql = generate_sql_for_property(uuid, property_rows)
        print(sql)
        print()
        count += 1

    print("COMMIT;")
    print()
    print(f"-- Done. {count} properties updated.")

    # Summary to stderr
    print(f"\n-- Summary --", file=sys.stderr)
    print(f"Total CSV rows: {len(rows)}", file=sys.stderr)
    print(f"Unique properties: {len(grouped)}", file=sys.stderr)
    print(f"Skipped (no UUID): {skipped_no_uuid}", file=sys.stderr)

    # Show multi-person stats
    multi_person = sum(1 for v in grouped.values() if len(v) > 1)
    three_person = sum(1 for v in grouped.values() if len(v) >= 3)
    print(f"Properties with 2+ persons: {multi_person}", file=sys.stderr)
    print(f"Properties with 3 persons: {three_person}", file=sys.stderr)


if __name__ == "__main__":
    main()
