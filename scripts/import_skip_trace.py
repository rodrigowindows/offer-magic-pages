#!/usr/bin/env python3
"""
Import skip trace CSV data into Supabase properties table.
Replicates the logic from SkipTracingImporter.tsx.
"""

import csv
import json
import sys
import os
import requests
from datetime import datetime

# Supabase config
SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"
ANON_KEY = None

def load_anon_key():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    with open(env_path) as f:
        for line in f:
            if line.startswith('VITE_SUPABASE_PUBLISHABLE_KEY='):
                val = line.split('=', 1)[1].strip().strip('"').strip("'")
                return val
    raise ValueError("Could not find VITE_SUPABASE_PUBLISHABLE_KEY in .env")

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

def extract_relative_columns(row, csv_prefix, db_prefix):
    data = {}
    for i in range(1, 6):
        name_val = val(row, f'{csv_prefix}Relative{i} Name')
        age_val = val_int(row, f'{csv_prefix}Relative{i} Age')
        if name_val:
            data[f'{db_prefix}relative{i}_name'] = name_val
        if age_val is not None:
            data[f'{db_prefix}relative{i}_age'] = age_val
        for j in range(1, 6):
            phone_val = val(row, f'{csv_prefix}Relative{i} Phone{j}')
            type_val = val(row, f'{csv_prefix}Relative{i} Phone{j} Type')
            if phone_val:
                data[f'{db_prefix}relative{i}_phone{j}'] = phone_val
            if type_val:
                data[f'{db_prefix}relative{i}_phone{j}_type'] = type_val
    return data

def fetch_property(session, property_id, headers):
    """Fetch property by UUID"""
    url = f"{SUPABASE_URL}/rest/v1/properties?select=id,address,city,state,zip_code,owner_name,owner_phone,tags&id=eq.{property_id}"
    resp = session.get(url, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        if data:
            return data[0]
    return None

def update_property(session, property_id, update_data, headers):
    """Update property by UUID"""
    url = f"{SUPABASE_URL}/rest/v1/properties?id=eq.{property_id}"
    h = {**headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}
    resp = session.patch(url, json=update_data, headers=h)
    if resp.status_code not in (200, 204):
        raise Exception(f"Update failed ({resp.status_code}): {resp.text}")

def process_row(row, session, headers, update_existing=True):
    """Process a single CSV row - returns (status, detail)"""
    custom_field1 = val(row, 'Input Custom Field 1')
    address = val(row, 'Input Property Address')

    match_id = custom_field1
    if not match_id and not address:
        return 'skipped', 'No ID or address'

    # Fetch property
    prop = None
    if match_id:
        prop = fetch_property(session, match_id, headers)

    if not prop:
        return 'skipped', f'Skip: {match_id or address} - not found'

    result_code = val(row, 'ResultCode')

    # Primary person
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

    update_data = {}

    # Owner name & phone
    if update_existing or not prop.get('owner_name'):
        if first_name and last_name:
            update_data['owner_name'] = f'{first_name} {last_name}'
    if update_existing or not prop.get('owner_phone'):
        if best_phone:
            update_data['owner_phone'] = best_phone

    # Matched name and result code
    if first_name:
        update_data['matched_first_name'] = first_name
    if last_name:
        update_data['matched_last_name'] = last_name
    if result_code:
        update_data['resultcode'] = result_code

    # Input fields
    input_first = val(row, 'Input First Name')
    input_last = val(row, 'Input Last Name')
    if input_first:
        update_data['input_first_name'] = input_first
    if input_last:
        update_data['input_last_name'] = input_last
    if address:
        update_data['input_property_address'] = address
    input_city = val(row, 'Input Property City')
    if input_city:
        update_data['input_property_city'] = input_city
    input_state = val(row, 'Input Property State')
    if input_state:
        update_data['input_property_state'] = input_state
    input_zip = val(row, 'Input Property Zip')
    if input_zip:
        update_data['input_property_zip'] = input_zip

    # Primary person fields
    if age is not None:
        update_data['age'] = age
    update_data['deceased'] = is_deceased
    update_data['dnc_flag'] = is_dnc
    dnc_scrub = val(row, 'DNC/Litigator Scrub')
    if dnc_scrub:
        update_data['dnc_litigator_scrub'] = dnc_scrub
    if email1:
        update_data['email1'] = email1
    if email2:
        update_data['email2'] = email2

    # Phones 1-7
    for i in range(1, 8):
        p = val(row, f'Phone{i}')
        t = val(row, f'Phone{i} Type')
        if p:
            update_data[f'phone{i}'] = p
        if t:
            update_data[f'phone{i}_type'] = t

    # Confirmed mailing address
    cma = val(row, 'Confirmed Mailing Address')
    if cma:
        update_data['confirmed_mailing_address'] = cma
    cmc = val(row, 'Confirmed Mailing City')
    if cmc:
        update_data['confirmed_mailing_city'] = cmc
    cms = val(row, 'Confirmed Mailing State')
    if cms:
        update_data['confirmed_mailing_state'] = cms
    cmz = val(row, 'Confirmed Mailing Zip')
    if cmz:
        update_data['confirmed_mailing_zip'] = cmz

    # Primary relatives
    update_data.update(extract_relative_columns(row, '', ''))

    # Person 2
    p2_first = val(row, 'Person2 First Name')
    p2_last = val(row, 'Person2 Last Name')
    if p2_first or p2_last:
        if p2_first:
            update_data['person2_first_name'] = p2_first
        if p2_last:
            update_data['person2_last_name'] = p2_last
        p2_age = val_int(row, 'Person2 Age')
        if p2_age is not None:
            update_data['person2_age'] = p2_age
        update_data['person2_deceased'] = val(row, 'Person2 Deceased') == 'Y'
        p2e1 = val(row, 'Person2 Email1')
        if p2e1:
            update_data['person2_email1'] = p2e1
        p2e2 = val(row, 'Person2 Email2')
        if p2e2:
            update_data['person2_email2'] = p2e2
        p2cma = val(row, 'Person2 Confirmed Mailing Address')
        if p2cma:
            update_data['person2_confirmed_mailing_address'] = p2cma
        p2cmc = val(row, 'Person2 Confirmed Mailing City')
        if p2cmc:
            update_data['person2_confirmed_mailing_city'] = p2cmc
        p2cms = val(row, 'Person2 Confirmed Mailing State')
        if p2cms:
            update_data['person2_confirmed_mailing_state'] = p2cms
        p2cmz = val(row, 'Person2 Confirmed Mailing Zip')
        if p2cmz:
            update_data['person2_confirmed_mailing_zip'] = p2cmz
        for i in range(1, 8):
            p = val(row, f'Person2 Phone{i}')
            t = val(row, f'Person2 Phone{i} Type')
            if p:
                update_data[f'person2_phone{i}'] = p
            if t:
                update_data[f'person2_phone{i}_type'] = t
        update_data.update(extract_relative_columns(row, 'Person2 ', 'person2_'))

    # Person 3
    p3_first = val(row, 'Person3 First Name')
    p3_last = val(row, 'Person3 Last Name')
    if p3_first or p3_last:
        if p3_first:
            update_data['person3_first_name'] = p3_first
        if p3_last:
            update_data['person3_last_name'] = p3_last
        p3_age = val_int(row, 'Person3 Age')
        if p3_age is not None:
            update_data['person3_age'] = p3_age
        update_data['person3_deceased'] = val(row, 'Person3 Deceased') == 'Y'
        p3e1 = val(row, 'Person3 Email1')
        if p3e1:
            update_data['person3_email1'] = p3e1
        p3e2 = val(row, 'Person3 Email2')
        if p3e2:
            update_data['person3_email2'] = p3e2
        p3cma = val(row, 'Person3 Confirmed Mailing Address')
        if p3cma:
            update_data['person3_confirmed_mailing_address'] = p3cma
        p3cmc = val(row, 'Person3 Confirmed Mailing City')
        if p3cmc:
            update_data['person3_confirmed_mailing_city'] = p3cmc
        p3cms = val(row, 'Person3 Confirmed Mailing State')
        if p3cms:
            update_data['person3_confirmed_mailing_state'] = p3cms
        p3cmz = val(row, 'Person3 Confirmed Mailing Zip')
        if p3cmz:
            update_data['person3_confirmed_mailing_zip'] = p3cmz
        for i in range(1, 8):
            p = val(row, f'Person3 Phone{i}')
            t = val(row, f'Person3 Phone{i} Type')
            if p:
                update_data[f'person3_phone{i}'] = p
            if t:
                update_data[f'person3_phone{i}_type'] = t
        update_data.update(extract_relative_columns(row, 'Person3 ', 'person3_'))

    # Tags
    current_tags = prop.get('tags') or []
    if not isinstance(current_tags, list):
        current_tags = []
    new_tags = list(current_tags)
    if is_dnc and 'DNC' not in new_tags:
        new_tags.append('DNC')
    if is_deceased and 'Deceased' not in new_tags:
        new_tags.append('Deceased')
    if len(new_tags) > len(current_tags):
        update_data['tags'] = new_tags

    # Skip tracing data (JSON backup)
    update_data['skip_tracing_data'] = {
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

    # Update
    update_property(session, prop['id'], update_data, headers)

    flags = []
    if is_dnc:
        flags.append('DNC')
    if is_deceased:
        flags.append('DEC')
    return 'updated', f'OK: {address or match_id} -> {first_name} {last_name} | {len(phones)}ph {" ".join(flags)}'


def main():
    global ANON_KEY
    ANON_KEY = load_anon_key()

    csv_file = sys.argv[1] if len(sys.argv) > 1 else '/tmp/skip_trace.csv'

    if not os.path.exists(csv_file):
        print(f"ERROR: CSV file not found: {csv_file}")
        sys.exit(1)

    headers = {
        'apikey': ANON_KEY,
        'Authorization': f'Bearer {ANON_KEY}',
    }

    session = requests.Session()

    stats = {'total': 0, 'matched': 0, 'updated': 0, 'skipped': 0, 'errors': 0}

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    stats['total'] = len(rows)
    print(f"Processing {stats['total']} rows...")

    for i, row in enumerate(rows):
        try:
            status, detail = process_row(row, session, headers, update_existing=True)
            if status == 'updated':
                stats['matched'] += 1
                stats['updated'] += 1
            elif status == 'skipped':
                stats['skipped'] += 1
            print(f"  [{i+1}/{stats['total']}] {detail}")
        except Exception as e:
            stats['errors'] += 1
            addr = val(row, 'Input Property Address') or val(row, 'Input Custom Field 1')
            print(f"  [{i+1}/{stats['total']}] ERR: {addr} - {e}")

    print(f"\n=== RESULTS ===")
    print(f"Total:    {stats['total']}")
    print(f"Matched:  {stats['matched']}")
    print(f"Updated:  {stats['updated']}")
    print(f"Skipped:  {stats['skipped']}")
    print(f"Errors:   {stats['errors']}")


if __name__ == '__main__':
    main()
