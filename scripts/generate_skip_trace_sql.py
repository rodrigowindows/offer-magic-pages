#!/usr/bin/env python3
"""
Generate SQL UPDATE statements for skip trace CSV data import.
Run in Supabase SQL Editor.
"""

import csv
import json
import sys
import os
from datetime import datetime

def val(row, key):
    v = row.get(key, '') or ''
    v = v.strip()
    return v if v else None

def val_int(row, key):
    v = val(row, key)
    if v:
        try:
            return int(v)
        except ValueError:
            return None
    return None

def sql_str(v):
    if v is None:
        return 'NULL'
    return "'" + str(v).replace("'", "''") + "'"

def sql_bool(v):
    return 'true' if v else 'false'

def sql_int(v):
    if v is None:
        return 'NULL'
    return str(v)

def sql_json(obj):
    return "'" + json.dumps(obj).replace("'", "''") + "'::jsonb"

def get_best_phone(phones):
    for p in phones:
        if p['type'] == 'Mobile' and p['number']:
            return p['number']
    for p in phones:
        if p['type'] == 'Residential' and p['number']:
            return p['number']
    for p in phones:
        if p['number']:
            return p['number']
    return None

def process_row(row):
    custom_field1 = val(row, 'Input Custom Field 1')
    address = val(row, 'Input Property Address')

    if not custom_field1:
        return None  # No UUID to match

    result_code = val(row, 'ResultCode')
    first_name = val(row, 'Matched First Name')
    last_name = val(row, 'Matched Last Name')
    is_dnc = val(row, 'DNC/Litigator Scrub') in ('DNC', 'Yes')
    is_deceased = val(row, 'Deceased') == 'Y'
    age = val_int(row, 'Age')

    phones = []
    for i in range(1, 8):
        phone = val(row, f'Phone{i}')
        ptype = val(row, f'Phone{i} Type')
        if phone:
            phones.append({'number': phone, 'type': ptype or 'Unknown'})

    best_phone = get_best_phone(phones)
    email1 = val(row, 'Email1')
    email2 = val(row, 'Email2')

    # Build SET clauses
    sets = []

    # Owner
    if first_name and last_name:
        sets.append(f"owner_name = {sql_str(f'{first_name} {last_name}')}")
    if best_phone:
        sets.append(f"owner_phone = {sql_str(best_phone)}")

    # Primary fields
    if age is not None:
        sets.append(f"age = {sql_int(age)}")
    sets.append(f"deceased = {sql_bool(is_deceased)}")
    sets.append(f"dnc_flag = {sql_bool(is_dnc)}")
    dnc_scrub = val(row, 'DNC/Litigator Scrub')
    if dnc_scrub:
        sets.append(f"dnc_litigator_scrub = {sql_str(dnc_scrub)}")
    if email1:
        sets.append(f"email1 = {sql_str(email1)}")
    if email2:
        sets.append(f"email2 = {sql_str(email2)}")

    # Phones 1-7
    for i in range(1, 8):
        p = val(row, f'Phone{i}')
        t = val(row, f'Phone{i} Type')
        if p:
            sets.append(f"phone{i} = {sql_str(p)}")
        if t:
            sets.append(f"phone{i}_type = {sql_str(t)}")

    # Confirmed mailing
    for field, col in [('confirmed_mailing_address', 'Confirmed Mailing Address'),
                       ('confirmed_mailing_city', 'Confirmed Mailing City'),
                       ('confirmed_mailing_state', 'Confirmed Mailing State'),
                       ('confirmed_mailing_zip', 'Confirmed Mailing Zip')]:
        v = val(row, col)
        if v:
            sets.append(f"{field} = {sql_str(v)}")

    # Relatives 1-5
    for i in range(1, 6):
        name = val(row, f'Relative{i} Name')
        rel_age = val_int(row, f'Relative{i} Age')
        if name:
            sets.append(f"relative{i}_name = {sql_str(name)}")
        if rel_age is not None:
            sets.append(f"relative{i}_age = {sql_int(rel_age)}")
        for j in range(1, 6):
            rp = val(row, f'Relative{i} Phone{j}')
            rt = val(row, f'Relative{i} Phone{j} Type')
            if rp:
                sets.append(f"relative{i}_phone{j} = {sql_str(rp)}")
            if rt:
                sets.append(f"relative{i}_phone{j}_type = {sql_str(rt)}")

    # Person 2
    p2f = val(row, 'Person2 First Name')
    p2l = val(row, 'Person2 Last Name')
    if p2f or p2l:
        if p2f: sets.append(f"person2_first_name = {sql_str(p2f)}")
        if p2l: sets.append(f"person2_last_name = {sql_str(p2l)}")
        p2age = val_int(row, 'Person2 Age')
        if p2age is not None: sets.append(f"person2_age = {sql_int(p2age)}")
        sets.append(f"person2_deceased = {sql_bool(val(row, 'Person2 Deceased') == 'Y')}")
        for fld in ['Email1', 'Email2']:
            v = val(row, f'Person2 {fld}')
            if v: sets.append(f"person2_{fld.lower()} = {sql_str(v)}")
        for fld, col in [('person2_confirmed_mailing_address', 'Person2 Confirmed Mailing Address'),
                         ('person2_confirmed_mailing_city', 'Person2 Confirmed Mailing City'),
                         ('person2_confirmed_mailing_state', 'Person2 Confirmed Mailing State'),
                         ('person2_confirmed_mailing_zip', 'Person2 Confirmed Mailing Zip')]:
            v = val(row, col)
            if v: sets.append(f"{fld} = {sql_str(v)}")
        for i in range(1, 8):
            p = val(row, f'Person2 Phone{i}')
            t = val(row, f'Person2 Phone{i} Type')
            if p: sets.append(f"person2_phone{i} = {sql_str(p)}")
            if t: sets.append(f"person2_phone{i}_type = {sql_str(t)}")
        for i in range(1, 6):
            name = val(row, f'Person2 Relative{i} Name')
            rel_age = val_int(row, f'Person2 Relative{i} Age')
            if name: sets.append(f"person2_relative{i}_name = {sql_str(name)}")
            if rel_age is not None: sets.append(f"person2_relative{i}_age = {sql_int(rel_age)}")
            for j in range(1, 6):
                rp = val(row, f'Person2 Relative{i} Phone{j}')
                rt = val(row, f'Person2 Relative{i} Phone{j} Type')
                if rp: sets.append(f"person2_relative{i}_phone{j} = {sql_str(rp)}")
                if rt: sets.append(f"person2_relative{i}_phone{j}_type = {sql_str(rt)}")

    # Person 3
    p3f = val(row, 'Person3 First Name')
    p3l = val(row, 'Person3 Last Name')
    if p3f or p3l:
        if p3f: sets.append(f"person3_first_name = {sql_str(p3f)}")
        if p3l: sets.append(f"person3_last_name = {sql_str(p3l)}")
        p3age = val_int(row, 'Person3 Age')
        if p3age is not None: sets.append(f"person3_age = {sql_int(p3age)}")
        sets.append(f"person3_deceased = {sql_bool(val(row, 'Person3 Deceased') == 'Y')}")
        for fld in ['Email1', 'Email2']:
            v = val(row, f'Person3 {fld}')
            if v: sets.append(f"person3_{fld.lower()} = {sql_str(v)}")
        for fld, col in [('person3_confirmed_mailing_address', 'Person3 Confirmed Mailing Address'),
                         ('person3_confirmed_mailing_city', 'Person3 Confirmed Mailing City'),
                         ('person3_confirmed_mailing_state', 'Person3 Confirmed Mailing State'),
                         ('person3_confirmed_mailing_zip', 'Person3 Confirmed Mailing Zip')]:
            v = val(row, col)
            if v: sets.append(f"{fld} = {sql_str(v)}")
        for i in range(1, 8):
            p = val(row, f'Person3 Phone{i}')
            t = val(row, f'Person3 Phone{i} Type')
            if p: sets.append(f"person3_phone{i} = {sql_str(p)}")
            if t: sets.append(f"person3_phone{i}_type = {sql_str(t)}")
        for i in range(1, 6):
            name = val(row, f'Person3 Relative{i} Name')
            rel_age = val_int(row, f'Person3 Relative{i} Age')
            if name: sets.append(f"person3_relative{i}_name = {sql_str(name)}")
            if rel_age is not None: sets.append(f"person3_relative{i}_age = {sql_int(rel_age)}")
            for j in range(1, 6):
                rp = val(row, f'Person3 Relative{i} Phone{j}')
                rt = val(row, f'Person3 Relative{i} Phone{j} Type')
                if rp: sets.append(f"person3_relative{i}_phone{j} = {sql_str(rp)}")
                if rt: sets.append(f"person3_relative{i}_phone{j}_type = {sql_str(rt)}")

    # Skip tracing data JSON
    skip_data = {
        'firstName': first_name,
        'lastName': last_name,
        'age': age,
        'isDNC': is_dnc,
        'isDeceased': is_deceased,
        'resultCode': result_code,
        'phones': [{'number': p['number'], 'type': p['type']} for p in phones],
        'emails': [e for e in [email1, email2] if e],
        'updatedAt': datetime.utcnow().isoformat() + 'Z',
    }
    sets.append(f"skip_tracing_data = {sql_json(skip_data)}")

    # DNC/Deceased tags via array append
    tag_updates = []
    if is_dnc:
        tag_updates.append("'DNC'")
    if is_deceased:
        tag_updates.append("'Deceased'")

    if tag_updates:
        tag_vals = ', '.join(tag_updates)
        # Use array_cat with COALESCE for safe merge, removing duplicates
        sets.append(f"tags = (SELECT array_agg(DISTINCT elem) FROM unnest(COALESCE(tags, ARRAY[]::text[]) || ARRAY[{tag_vals}]) AS elem)")

    set_clause = ',\n  '.join(sets)
    sql = f"-- {address or 'Unknown'}\nUPDATE properties SET\n  {set_clause}\nWHERE id = '{custom_field1}';\n"
    return sql


def main():
    csv_file = sys.argv[1] if len(sys.argv) > 1 else '/tmp/skip_trace.csv'
    output_file = sys.argv[2] if len(sys.argv) > 2 else '/tmp/skip_trace_import.sql'

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Processing {len(rows)} rows...")

    sqls = []
    skipped = 0
    for row in rows:
        sql = process_row(row)
        if sql:
            sqls.append(sql)
        else:
            skipped += 1

    with open(output_file, 'w') as f:
        f.write("-- Skip Trace Import SQL\n")
        f.write(f"-- Generated: {datetime.utcnow().isoformat()}Z\n")
        f.write(f"-- Total: {len(sqls)} updates, {skipped} skipped\n\n")
        f.write("BEGIN;\n\n")
        for sql in sqls:
            f.write(sql + "\n")
        f.write("COMMIT;\n")

    print(f"Generated {len(sqls)} SQL statements -> {output_file}")
    print(f"Skipped: {skipped}")


if __name__ == '__main__':
    main()
