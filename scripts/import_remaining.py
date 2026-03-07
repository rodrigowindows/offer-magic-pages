#!/usr/bin/env python3
"""Import remaining skip trace properties directly via Supabase REST API."""
import json, requests, os, sys
from datetime import datetime

SUPABASE_URL = "https://atwdkhlyrffbaugkaker.supabase.co"

def load_key():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    with open(env_path) as f:
        for line in f:
            if line.startswith('VITE_SUPABASE_PUBLISHABLE_KEY='):
                return line.split('=', 1)[1].strip().strip('"').strip("'")

KEY = load_key()
HEADERS = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}
session = requests.Session()

def update(pid, data):
    """Update a property by UUID."""
    # Add skip_tracing_data backup
    data['skip_tracing_data'] = {
        'firstName': data.get('owner_name', '').split(' ')[0] if data.get('owner_name') else None,
        'lastName': ' '.join(data.get('owner_name', '').split(' ')[1:]) if data.get('owner_name') else None,
        'isDNC': data.get('dnc_flag', False),
        'isDeceased': data.get('deceased', False),
        'updatedAt': datetime.utcnow().isoformat() + 'Z',
    }

    # First fetch current tags
    resp = session.get(f"{SUPABASE_URL}/rest/v1/properties?select=tags&id=eq.{pid}", headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    if resp.status_code == 200 and resp.json():
        tags = resp.json()[0].get('tags') or []
        if data.get('dnc_flag') and 'DNC' not in tags:
            tags.append('DNC')
        if data.get('deceased') and 'Deceased' not in tags:
            tags.append('Deceased')
        if tags:
            data['tags'] = tags

    resp = session.patch(f"{SUPABASE_URL}/rest/v1/properties?id=eq.{pid}", json=data, headers=HEADERS)
    return resp.status_code in (200, 204)

# All remaining properties from skip trace CSV
# Format: (uuid, owner_name, phone1, phone1_type, dnc_flag, deceased, email1, email2, age)
PROPERTIES = [
    # Properties that need importing (not yet in skip_tracing_data)
    ("eea23d78-9101-425d-a033-74b1152ac0aa", "MARY CURLEY", "7279380151", "Residential", False, False, None, None, 64),
    ("b75fd000-4cb2-4687-93aa-8f50d9f2ffd5", "GRACE TONER", "4073516141", "Residential", False, True, "EDWARD.TONER@NETSCAPE.NET", None, 101),
    ("b8a4761d-d661-4131-81e6-8a80c5de5c32", "DARWIN ROJAS PEREZ", None, None, False, False, None, None, 49),
    ("c4a6e5e2-2365-4e1b-8db5-13eaeda3601c", "TRELISA TOMPKINS", "4072323719", "Mobile", False, False, "TKELLY09@ICLOUD.COM", None, 34),
    ("6853fca2-f56e-4cc2-b83a-21dd6391b920", "ANTHONY STEPHENS", "4074379951", "Mobile", False, False, "ANT_STEPS@LIVE.COM", None, 37),
    ("0367bf59-a388-4be9-adf8-239576170d71", "WILLIAM PAJAK", "4074275545", "Mobile", False, False, "BILL.ROSE37@YAHOO.COM", "SANGNGUYEN1104@HOTMAIL.COM", 51),
    ("cf20c521-fc00-448c-8d20-9526d6351c2d", "SHANIA LOVETTE", "4072363784", "Mobile", False, False, "SHANIALOVETTE2@GMAIL.COM", "LOVETTEB5127@GMAIL.COM", 27),
    ("a50bbd99-1604-4068-9af7-8dcdfedae8cf", "CHENET VICTORVIL", "4077656660", "Mobile", False, False, "GASNELVICTORVIL@YAHOO.COM", "CHEVINUSA@HOTMAIL.COM", 48),
    ("18b578a5-0554-4133-8ee8-d9772231a2cb", "JOANN CAMPBELL", "4075384467", "Mobile", True, False, "JMEEMA@JUNO.COM", "JMEEMA99@GMAIL.COM", 70),
    ("b99d148b-8e02-41c7-a59d-a9a9d7adf216", "VICKI TURNER", "7866630977", "Mobile", False, False, "VICHUNTER123@GMAIL.COM", "VICKI17@YAHOO.COM", 54),
    ("0a43b5a4-2cca-485c-bfaa-683b4269894e", "DYLAN SPRINGER", "4073601055", "Mobile", False, False, "DYLANBOBSPRINGER@GMAIL.COM", "MSPRINGER142@GMAIL.COM", 34),
    ("db4ecc96-3d10-4650-a4ed-a1b8c11d9b1a", "MELISSA NIEVES", "4079533730", "Mobile", False, False, "MNIEVES8307@AIM.COM", "MNIEVES8307@GMAIL.COM", 52),
    ("8c12f068-05dc-4d99-936c-66cf8d1c2908", "KIARA MUGRAUER", "4074702268", "Mobile", False, False, "MUGRAUERKIARA@GMAIL.COM", "KIARALYNNMUGRAUER@GMAIL.COM", 36),
    ("996d2354-6d55-478c-abf2-0c0714667520", "HIEP NGUYEN", "4156086237", "Mobile", False, False, "YEN.NGUYEN80@GMAIL.COM", "SFVIETGIRL@IX.NETCOM.COM", 65),
    ("44d44e6a-bc4f-49a2-9bce-ab9a845fb27d", "VICTOR VELAZQUEZ", "4072437047", "Mobile", False, False, "VICTORLUIS7091@MAIL.COM", "VEELAZQUEZJESSICA99@YAHOO.COM", 63),
    ("57bb72f7-7cce-4b20-9727-e071077ad377", "DENNIS REID", "4079488320", "Mobile", True, False, "MENOFTHECROSS@YAHOO.COM", "INMATESOFTHECROSS@YAHOO.COM", 69),
    ("628ab766-18bc-4725-a9df-3f1a0ea3629d", "HENRY BOLDEN", "4079253883", "Mobile", True, False, "TATTERAB@AOL.COM", None, 54),
    ("13d12caf-58bc-4e61-b658-16cb80dd0202", "CASSANDRA VELEZ", "4073343642", "Mobile", False, False, "CASSANDRAVELEZ23@GMAIL.COM", "CASSANDRAVELEZ23@GMAIL.CO.CL", 30),
    ("79f86f62-2edc-4e34-947c-097e970915c0", "SHAUNELL BULLOCK", "9733320149", "Mobile", False, False, "SHAUNELLLITTLES2027@GMAIL.COM", "SHAUNELLBULLOCK27@GMAIL.COM", 28),
    ("6b35819c-ecd4-45ec-9518-a6ad3d9db069", "LETITIA DAVIS", "4072713610", "Mobile", False, False, "LETITIA.DAVIS@EXCITE.COM", "JUICYGYRL07@GMAIL.COM", 40),
    ("83b7e8e7-0b13-47d8-a3f6-183ccad78649", "WILLIAM GRAHAM", "4075019896", "Mobile", False, False, "TRUTLAND33@GMAIL.COM", "YOVONDARENDER@YAHOO.COM", 59),
    ("7be03265-11da-45fe-a650-1d699c03a26c", "MICHAEL KENNEDY", "4078601579", "Mobile", True, False, "MIKE.KENNEDY108@GMAIL.COM", None, 68),
    ("b3f9e64f-ad1c-4580-b4cc-6b895daddfcb", None, None, None, False, False, None, None, None),  # 3553 STUART ST - no result
    ("fccffbf2-1d91-476f-a1f6-71b01f522b5a", "ELOY MARTINEZ ORTIZ", None, None, False, False, None, None, 37),
    ("0a010a8f-6624-41f5-bed2-025ad36da94b", "JOY GOLTRY", "4079718522", "Residential", True, False, "JGOLTRY@BELLSOUTH.NET", "GEANA@HOTMAIL.COM", 50),
    ("0a959987-434d-49aa-bad1-2a3917fabe7f", "MOISES VELAZQUEZ CLAUDIO", "4077574340", "Mobile", False, False, "MOISESVELAZQUEZ121675@GMAIL.COM", "EASTRIVER23@GMAIL.COM", 50),
    ("cdf5bbdc-edc7-4c91-9786-fe61bc510079", "HOLLACE PRICE", "3219481310", "Mobile", True, False, "HP_WARRANTY@YAHOO.COM", "VSHP@MSN.COM", 74),
    ("0777036b-c0e8-49d0-ad78-f75738a4e59f", "JACQUELINE HATFIELD", "4072341670", "Mobile", True, False, "BOWESJACQUELINE@GMAIL.COM", "JACKIECOMM1ST@YAHOO.COM", 48),
    ("d4d75dda-e44c-417c-a6cf-c53678684d8e", "CELANE PUGH", "4072476618", "Mobile", True, False, "CELANEP@ATT.NET", "BOXERMOM39@EARTHLINK.NET", 62),
    ("b2173086-ea3f-4715-8831-38c7ae15b4f7", "JOSE REYESMARTINEZ", "3219995908", "Mobile", False, False, "POCHIUIE175@GMAIL.COM", "POCHIE35@GMAIL.COM", 32),
    ("2d800a1b-692b-4a36-970e-fa43e5fb78fd", "ROLANDO CASTELLANOS", "3213308284", "Mobile", False, False, "ROLANDOCASTELLANO94@GMAIL.COM", "ROLANDOVASTELLANOS94@GMAIL.COM", 71),
    ("cdaeb4b8-6f61-42b1-9f41-4abda8167346", "MARY HARTER", "4072758266", "Residential", True, False, None, None, 94),
    ("15e8d60f-6a36-4d21-a1e8-8cac8a84f676", "HUGO VASQUEZ", "4074515744", "Mobile", True, False, "HUGO.VASQUEZ@GMAIL.COM", "COACHISSAC1437@GMAIL.COM", 54),
    ("fb73ba6c-8f1b-4811-ad1e-3862fd720440", "EDILIA CABRERA", "4074432790", "Mobile", False, False, None, None, 46),
    ("1fcd84b4-3706-4cf6-86c0-a5a66427dd12", "FREDY RAMOS", "4076922862", "Mobile", False, False, "FREDYGONZ1987@GMAIL.COM", "FREDYG1987@GMAIL.COM", 39),
    ("ae7fd1b3-f1bd-4724-9eb6-9e264f9fc43e", "VAN ROUSE", "5405481114", "Residential", True, True, None, None, 105),
    ("0dbc3320-8b98-48a0-842e-cc865d5d2e22", "AMAIRANI HERRERA", "4076000216", "Mobile", False, False, "ABRILACERO57@GMAIL.COM", "ESTRELLA12QW@GMAIL.COM", 28),
    ("099d7e39-380d-4454-bb7c-44ceee5b3f47", "JESSE WILDING", "4077158043", "Mobile", False, False, "SWILDING305@GMAIL.COM", "JESSEWILDING@YAHOO.COM", 61),
    ("87d7e3c4-87b1-4514-9306-2b4e3bd4a908", None, None, None, False, False, None, None, None),  # 201 CLARK ST - no result
    ("f1f150ac-1a06-4252-b027-8a5e7645e562", "RIKKITA MAEWEATHER", "4072762304", "Mobile", True, False, "THELUVLY01@LIVE.COM", "MONEYMANJAY99@GMAIL.COM", 55),
    ("11f0e140-2ecf-4d5c-9b6f-6060375cc265", "ROSA BROADDUS", "4074926096", "Mobile", True, False, "RLB407@OUTLOOK.COM", "RBROADDUS@CFL.RR.COM", 87),
    ("bfab5fb3-49eb-48ed-9166-8ce425c4118e", None, None, None, False, False, None, None, None),  # 103 SHORT ST - no result
    ("fe6cc727-9325-4c0f-b2b3-29bef3d45071", None, None, None, False, False, None, None, None),  # 51 E 13TH ST - no result
    ("25e134c0-263e-4b2e-ab13-1823c82aed03", "KELMAN RICHES", "4075388098", "Mobile", True, False, "KELMAN.RICHES@HOTMAIL.COM", "IKELMAN.RICHESR57@HOTMAIL.COM", 58),
    ("8e51e2c7-dfcb-4804-b948-435439f9d38b", "EVERETT SOBIESKI", "4077017110", "Mobile", True, False, "BSOBIESKI@YAHOO.COM", "SMGINC@YAHOO.COM", 56),
    ("27866b96-9863-46e4-9b7f-1cf31c76bdc7", "JUDY ROCHELLE", "4073077906", "Mobile", False, False, "JUDY.ROCHELLE@YAHOO.COM", "JUDYROCHELLE@YAHOO.COM", 59),
    ("9219891f-fff0-4e1a-9c42-93dfa4bbd602", "MAX MAXWELL", "4078238776", "Mobile", True, False, None, None, 67),
    ("9d3621f3-75e0-42d8-8eba-d7f052bed302", "VICTORIA BARKER", "4077211372", "Mobile", False, False, "APSASUPER@AOL.COM", "VICTORIA.SHAW@HOTMAIL.COM", 42),
    ("9d12e2c7-02ef-49b6-9ebb-c8d25c60690c", "DAVID GOOGE", None, None, False, False, None, None, 38),
    ("4613c0a0-3837-4e66-935f-6402d6ad3ebb", "WILLEM VANRIJN", "8138023464", "Mobile", False, False, "VANRIJNCDC@GMAIL.COM", "ELLENGUTHRIE78@GMAIL.COM", 32),
    ("02026a7a-a841-4b68-9158-81676a08f5c0", "LOUIS BOLING", "4079274105", "Mobile", True, False, "BOLING1320@GMAIL.COM", "BOLINGJACKSON59@GMAIL.COM", 44),
    ("31627b48-882f-4ffb-914f-8bc2f3154ff5", "ASHANTI FINNEY", "3214606630", "Mobile", False, False, "FINNEYA0325@GMAIL.COM", "POOHBEAR0325@GMAIL.COM", 26),
    ("4165e9b3-8c03-418f-a559-005f94678ea9", "EMILY VEGA MARRERO", "4075757312", "Mobile", False, False, "EMILYVEGAMARRERO12@GMAIL.COM", "JARILYS1992@GMAIL.COM", 31),
    ("ead04757-e790-49b5-8806-548daf9eb67b", "CATHERINE YOO", "7723414967", "Mobile", True, False, "CATYOO91@GMAIL.COM", "CHY2@STUDENTS.UWF.EDU", 34),
]

# Also update the 3 already-imported that might need refresh
ALREADY_IMPORTED = [
    ("9d5c8b61-4a8a-4bb1-a26d-9626e955495e", "ROBIN BURKS", "3216624173", "Mobile", False, False, "ROBINBURKS99@AOL.COM", "ROBINBURKS99@GMAIL.COM", 54),
    ("886ba307-fb56-4ee7-9739-75809f618aa2", "MAROLYN MORRISON", "4076831306", "Mobile", True, False, "MAROLYNMORRISON1@GMAIL.COM", "MAROLYN_36@HOTMAIL.COM", 57),
    ("79113787-dc5c-4c20-9dc7-7dc428d271a4", "NICOLE SEITZ", "3212719397", "Mobile", False, False, "NICOLESEITZ@LIVE.COM", "KIKILGS2000@AOL.COM", 40),
]

def process(props, label):
    ok = err = skip = 0
    for p in props:
        pid, name, phone, ptype, dnc, deceased, email1, email2, age = p

        if not name and not phone:
            # No result from skip trace
            data = {'skip_tracing_data': {'resultCode': 'NR', 'updatedAt': datetime.utcnow().isoformat() + 'Z'}}
            resp = session.patch(f"{SUPABASE_URL}/rest/v1/properties?id=eq.{pid}", json=data, headers=HEADERS)
            if resp.status_code in (200, 204):
                print(f"  [{skip+ok+err+1}] NR: {pid[:8]}... (no result)")
                skip += 1
            else:
                print(f"  [{skip+ok+err+1}] ERR: {pid[:8]}... {resp.text[:100]}")
                err += 1
            continue

        data = {}
        if name:
            data['owner_name'] = name
        if phone:
            data['owner_phone'] = phone
            data['phone1'] = phone
            data['phone1_type'] = ptype or 'Mobile'
        if email1:
            data['email1'] = email1
        if email2:
            data['email2'] = email2
        if age:
            data['age'] = age
        data['dnc_flag'] = dnc
        data['deceased'] = deceased
        if dnc:
            data['dnc_litigator_scrub'] = 'DNC'

        try:
            success = update(pid, data)
            if success:
                flags = []
                if dnc: flags.append('DNC')
                if deceased: flags.append('DEC')
                flag_str = ' '.join(flags)
                print(f"  [{skip+ok+err+1}] OK: {pid[:8]}... {name} | {flag_str}")
                ok += 1
            else:
                print(f"  [{skip+ok+err+1}] FAIL: {pid[:8]}... {name}")
                err += 1
        except Exception as e:
            print(f"  [{skip+ok+err+1}] ERR: {pid[:8]}... {e}")
            err += 1

    return ok, err, skip

print(f"=== Importing {len(PROPERTIES)} remaining properties ===")
ok1, err1, skip1 = process(PROPERTIES, "remaining")

print(f"\n=== Refreshing {len(ALREADY_IMPORTED)} already imported ===")
ok2, err2, skip2 = process(ALREADY_IMPORTED, "refresh")

total_ok = ok1 + ok2
total_err = err1 + err2
total_skip = skip1 + skip2
print(f"\n=== FINAL RESULTS ===")
print(f"Updated:  {total_ok}")
print(f"Skipped:  {total_skip} (no result)")
print(f"Errors:   {total_err}")
print(f"Total:    {total_ok + total_err + total_skip}")
