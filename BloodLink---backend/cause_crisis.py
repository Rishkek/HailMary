import sqlite3
import time
import random
import pandas as pd
import os
import threading

BLOOD_GROUPS = ['O_pos', 'O_neg', 'A_pos', 'A_neg', 'B_pos', 'B_neg', 'AB_pos', 'AB_neg']
WEIGHTS = [0.37, 0.01, 0.22, 0.005, 0.32, 0.005, 0.069, 0.001]

CRISIS_CASES = {
    0: {'amount': 1, 'duration': 9, 'name': 'Minor'},
    1: {'amount': 2, 'duration': 20, 'name': 'Small'},
    2: {'amount': 3, 'duration': 30, 'name': 'Medium'},
    3: {'amount': 4, 'duration': 35, 'name': 'Large'}
}


def update_crisis_csv(hosp_ids, case_idx_map, is_active):
    filename = "crisises.csv"
    if os.path.exists(filename):
        df = pd.read_csv(filename)
    else:
        conn = sqlite3.connect('hospitals.db')
        df = pd.read_sql("SELECT id as Hospital_id, name as hospital_name FROM hospitals", conn)
        conn.close()
        df['in_crisis'] = 'no'
        df['crisis_type'] = 'None'

    for hid in hosp_ids:
        idx = df.index[df['Hospital_id'] == hid]
        if not idx.empty:
            df.loc[idx, 'in_crisis'] = 'yes' if is_active else 'no'
            c_type = case_idx_map.get(hid, 'None') if is_active else 'None'
            df.loc[idx, 'crisis_type'] = c_type

    df.to_csv(filename, index=False)


def execute_crisis_payload(payload):
    """Payload format: [{'id': 1, 'type': 2}, {'id': 4, 'type': 0}]"""
    if not payload: return

    conn = sqlite3.connect('hospitals.db')
    cursor = conn.cursor()

    hosp_ids = [item['id'] for item in payload]
    case_map = {item['id']: item['type'] for item in payload}

    update_crisis_csv(hosp_ids, case_map, is_active=True)

    tracking = {}
    max_duration = 0

    # Setup the tracking logic for durations
    for item in payload:
        hid = item['id']
        c_type = int(item['type'])
        crisis_info = CRISIS_CASES[c_type]
        if crisis_info['duration'] > max_duration:
            max_duration = crisis_info['duration']

        tracking[hid] = {
            'amount_per_sec': crisis_info['amount'],
            'duration': crisis_info['duration']
        }

    for sec in range(1, max_duration + 1):
        # 1. Fetch FRESH DB data every second to prevent stale overwrites
        placeholders = ','.join('?' for _ in hosp_ids)
        cursor.execute(f"SELECT id, {', '.join(BLOOD_GROUPS)} FROM hospitals WHERE id IN ({placeholders})", hosp_ids)
        fresh_data = cursor.fetchall()

        for row in fresh_data:
            hid = row[0]
            h_data = tracking[hid]

            if sec > h_data['duration']:
                continue

                # Update inventory using the FRESH numbers from the database
            inventory = list(row[1:])

            types_to_decrease = random.choices(range(len(BLOOD_GROUPS)), weights=WEIGHTS, k=h_data['amount_per_sec'])
            for bg_idx in types_to_decrease:
                if inventory[bg_idx] > 0:
                    inventory[bg_idx] -= 1

            new_total = sum(inventory)

            cursor.execute(f"""
                UPDATE hospitals
                SET O_pos=?, O_neg=?, A_pos=?, A_neg=?, B_pos=?, B_neg=?, AB_pos=?, AB_neg=?, Total_Units=?
                WHERE id=?
            """, (*inventory, new_total, hid))

        conn.commit()
        time.sleep(1)

    update_crisis_csv(hosp_ids, case_map, is_active=False)
    # Only push to CSV at the very end to prevent locking errors
    pd.read_sql("SELECT * FROM hospitals", conn).to_csv("hospitals.csv", index=False)
    conn.close()


def trigger_crisis_api(payload):
    thread = threading.Thread(target=execute_crisis_payload, args=(payload,))
    thread.daemon = True
    thread.start()