import sqlite3
import json
import time
import math
import re
import os

BLOOD_GROUPS = ['O_pos', 'O_neg', 'A_pos', 'A_neg', 'B_pos', 'B_neg', 'AB_pos', 'AB_neg']
DISTRIBUTION = [0.37, 0.01, 0.22, 0.005, 0.32, 0.005, 0.069, 0.001]
MIN_REQUIREMENTS = {"Large": 150, "Big": 100, "Moderate": 75, "Medium": 50, "Clinic": 25, "Small": 10}

pending_deliveries = []  # Tracks trucks currently on the road
action_logs = []


def add_log(msg):
    action_logs.insert(0, msg)
    if len(action_logs) > 50: action_logs.pop()


def get_db_connection():
    conn = sqlite3.connect('hospitals.db', timeout=20)
    conn.execute('PRAGMA journal_mode=WAL;')
    return conn


def get_timescale():
    try:
        if os.path.exists('timescale.txt'):
            return max(1.0, min(25.0, float(open('timescale.txt', 'r').read().strip())))
    except:
        pass
    return 1.0


def extract_coords(loc_str):
    matches = re.findall(r"[-+]?\d*\.\d+", str(loc_str))
    if len(matches) >= 2: return float(matches[0]), float(matches[1])
    return 0.0, 0.0


def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def resolve_crises():
    global pending_deliveries, action_logs

    ts = get_timescale()
    now = time.time()
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Load current DB state
    cursor.execute(f"SELECT id, location, Size, name, {', '.join(BLOOD_GROUPS)} FROM hospitals")
    hosp_dict = {}
    for row in cursor.fetchall():
        hid, loc, size, name = row[0], row[1], row[2] if row[2] else 'Medium', row[3]
        lat, lon = extract_coords(loc)
        base_req = MIN_REQUIREMENTS.get(size, 50)
        thresholds = [max(1, int(base_req * d)) for d in DISTRIBUTION]
        hosp_dict[hid] = {'lat': lat, 'lon': lon, 'name': name, 'inv': list(row[4:]), 'thresholds': thresholds}

    updates_needed = {}

    # 2. PROCESS ARRIVALS (Trucks that successfully reached their destination)
    still_pending = []
    for delivery in pending_deliveries:
        if now >= delivery['arrival_time']:
            # The truck arrived! FULFILL THE REQUEST.
            rec_id = delivery['rec_id']
            bg_idx = BLOOD_GROUPS.index(delivery['bg'])

            hosp_dict[rec_id]['inv'][bg_idx] += delivery['amount']
            updates_needed[rec_id] = hosp_dict[rec_id]['inv']

            add_log(
                f"[{time.strftime('%H:%M:%S')}] ✅ ARRIVED: {delivery['amount']}u of {delivery['bg']} unloaded at {hosp_dict[rec_id]['name']}.")
        else:
            still_pending.append(delivery)

    pending_deliveries = still_pending

    # 3. Prevent Over-Dispatching by tracking blood that is currently driving on the road
    incoming_blood = {hid: [0] * 8 for hid in hosp_dict.keys()}
    for d in pending_deliveries:
        bg_idx = BLOOD_GROUPS.index(d['bg'])
        incoming_blood[d['rec_id']][bg_idx] += d['amount']

    transfer_rate = max(5, int(15 * ts))

    # 4. DISPATCH NEW TRUCKS
    for rec_id, rec_data in hosp_dict.items():
        for i, bg in enumerate(BLOOD_GROUPS):
            # Needed = Safety Threshold - (Current Inventory + Blood already on the way)
            actual_needed = rec_data['thresholds'][i] - (rec_data['inv'][i] + incoming_blood[rec_id][i])

            if actual_needed > 0:
                nearby = []
                for d_id, d_data in hosp_dict.items():
                    if d_id == rec_id: continue
                    surplus = d_data['inv'][i] - d_data['thresholds'][i]
                    if surplus > 0:
                        dist = haversine(rec_data['lat'], rec_data['lon'], d_data['lat'], d_data['lon'])
                        nearby.append((dist, d_id, surplus, d_data))

                nearby.sort(key=lambda x: x[0])

                if nearby:
                    best_donor = nearby[0]
                    d_id = best_donor[1]
                    d_data = best_donor[3]
                    dist = best_donor[0]

                    take = min(actual_needed, best_donor[2], transfer_rate)

                    # DEDUCT from donor immediately (it's physically loaded onto the truck)
                    d_data['inv'][i] -= take
                    updates_needed[d_id] = d_data['inv']

                    # Calculate Transit Time (Distance based + Base time, scaled by time slider)
                    transit_time = (12.0 + (dist * 0.5)) / ts

                    pending_deliveries.append({
                        'rec_id': rec_id,
                        'donor_id': d_id,
                        'bg': bg,
                        'amount': take,
                        'arrival_time': now + transit_time,
                        'route': [[d_data['lat'], d_data['lon']], [rec_data['lat'], rec_data['lon']]]
                    })

                    add_log(
                        f"[{time.strftime('%H:%M:%S')}] 🚚 EN ROUTE: {d_data['name']} dispatched {take}u {bg} to {rec_data['name']}")

    # 5. Commit DB updates
    if updates_needed:
        bulk_data = [(*inv, sum(inv), hid) for hid, inv in updates_needed.items()]
        cursor.executemany(
            f"UPDATE hospitals SET {', '.join([f'{bg}=?' for bg in BLOOD_GROUPS])}, Total_Units=? WHERE id=?",
            bulk_data)
        conn.commit()

    conn.close()

    # 6. Format routes for the frontend map
    active_routes_map = {}
    for d in pending_deliveries:
        rid = d['rec_id']
        if rid not in active_routes_map:
            active_routes_map[rid] = {
                'receiver_id': rid,
                'rec_lat': hosp_dict[rid]['lat'],
                'rec_lon': hosp_dict[rid]['lon'],
                'donors': []
            }
        active_routes_map[rid]['donors'].append({
            'donor_id': d['donor_id'], 'bg': d['bg'], 'amount': d['amount'], 'route': d['route']
        })

    with open('active_routes.json', 'w') as f:
        json.dump(list(active_routes_map.values()), f)

    if action_logs:
        with open('supply_logs.json', 'w') as f:
            json.dump(action_logs, f)


def run():
    print("🚀 IN-TRANSIT LOGISTICS ENGINE ONLINE: Waiting for trucks to arrive before fulfilling! 🚀")
    while True:
        ts = get_timescale()
        resolve_crises()
        time.sleep(1.0 / ts)


if __name__ == '__main__':
    run()