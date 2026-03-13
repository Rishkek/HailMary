import sqlite3
import pandas as pd
import json
import time
import math
import os
import re
import urllib.request

BLOOD_GROUPS = ['O_pos', 'O_neg', 'A_pos', 'A_neg', 'B_pos', 'B_neg', 'AB_pos', 'AB_neg']
DISTRIBUTION = [0.37, 0.01, 0.22, 0.005, 0.32, 0.005, 0.069, 0.001]

MIN_REQUIREMENTS = {
    "Large": 150, "Big": 100, "Moderate": 75,
    "Medium": 50, "Clinic": 25, "Small": 10
}

action_logs = []
active_emergencies = {}
active_dispatches = {}
route_cache = {}


def add_log(msg):
    action_logs.insert(0, f"[{time.strftime('%H:%M:%S')}] {msg}")
    if len(action_logs) > 50: action_logs.pop()


def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def extract_coords(loc_str):
    matches = re.findall(r"[-+]?\d*\.\d+", str(loc_str))
    if len(matches) >= 2: return float(matches[0]), float(matches[1])
    return 0.0, 0.0


def get_osrm_route(lat1, lon1, lat2, lon2):
    """Fetches real road geometry. Falls back to straight line if API fails."""
    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?geometries=geojson"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'BloodLinkSim/1.0'})
        with urllib.request.urlopen(req, timeout=3) as response:
            res = json.loads(response.read().decode())
            if res.get('code') == 'Ok':
                coords = res['routes'][0]['geometry']['coordinates']
                return [[c[1], c[0]] for c in coords]
    except Exception as e:
        print(f"OSRM Route skipped: {e}")
    return [[lat1, lon1], [lat2, lon2]]


def resolve_crises():
    global active_emergencies, active_dispatches, route_cache

    if not os.path.exists('ticket.csv'):
        with open('active_routes.json', 'w') as f: json.dump([], f)
        return

    try:
        tickets_df = pd.read_csv('ticket.csv')
        if tickets_df.empty: raise ValueError
    except:
        with open('active_routes.json', 'w') as f:
            json.dump([], f)
        return

    conn = sqlite3.connect('hospitals.db', timeout=10)
    cursor = conn.cursor()

    # Check if trucks exist safely
    try:
        t_conn = sqlite3.connect('truck_availability.db', timeout=10)
        t_cursor = t_conn.cursor()
        t_cursor.execute("SELECT Hospital_id, Available_Trucks, In_Transit FROM trucks")
        truck_rows = t_cursor.fetchall()
        if not truck_rows:
            add_log("⚠️ ERROR: No trucks in database! Run truck_key_generator.py -> truck_availability_controller.py")
        truck_dict = {r[0]: {'avail': r[1], 'transit': r[2]} for r in truck_rows}
    except Exception:
        add_log("⚠️ ERROR: Could not read truck database!")
        truck_dict = {}

    cursor.execute(f"SELECT id, location, Size, name, {', '.join(BLOOD_GROUPS)} FROM hospitals")
    hosp_dict = {}
    for row in cursor.fetchall():
        hid, loc, size, name = row[0], row[1], row[2] if row[2] else 'Medium', row[3]
        lat, lon = extract_coords(loc)
        base_req = MIN_REQUIREMENTS.get(size, 50)
        thresholds = [max(1, int(base_req * d)) for d in DISTRIBUTION]
        hosp_dict[hid] = {'lat': lat, 'lon': lon, 'name': name, 'inv': list(row[4:]), 'thresholds': thresholds}

    active_routes = []
    updates_needed = {}
    trucks_to_update = {}

    for _, ticket in tickets_df.iterrows():
        receiver_id = int(ticket['Sl.no'])
        if receiver_id not in hosp_dict: continue
        rec_data = hosp_dict[receiver_id]

        if receiver_id not in active_emergencies:
            active_emergencies[receiver_id] = {}
            active_dispatches[receiver_id] = {}

        nearby = []
        for hid, data in hosp_dict.items():
            if hid == receiver_id: continue
            dist = haversine(rec_data['lat'], rec_data['lon'], data['lat'], data['lon'])
            if dist <= 4.0: nearby.append((dist, hid, data['name']))
        nearby.sort(key=lambda x: x[0])

        donors_used = []

        for i, bg in enumerate(BLOOD_GROUPS):
            req_col = f"Req_{bg}"
            if req_col not in ticket: continue

            target_amount = rec_data['thresholds'][i] + 10
            actual_needed = target_amount - rec_data['inv'][i]
            is_active = active_emergencies[receiver_id].get(bg, False)

            if actual_needed <= 0:
                if is_active:
                    active_emergencies[receiver_id][bg] = False
                    add_log(f"🟢 {rec_data['name']} stabilized {bg}. Returning trucks to base.")
                    for d_id in active_dispatches[receiver_id].get(bg, []):
                        if d_id in truck_dict:
                            truck_dict[d_id]['avail'] += 1
                            truck_dict[d_id]['transit'] -= 1
                            trucks_to_update[d_id] = truck_dict[d_id]
                    active_dispatches[receiver_id][bg] = []
                continue

            dire_threshold = max(3, int(rec_data['thresholds'][i] * 0.40))
            if rec_data['inv'][i] <= dire_threshold and not is_active:
                active_emergencies[receiver_id][bg] = True
                active_dispatches[receiver_id][bg] = []
                add_log(f"🚨 {rec_data['name']} {bg} critical! Seeking available trucks...")

            if not active_emergencies[receiver_id].get(bg, False):
                continue

            # Existing Dispatches
            for d_id in list(active_dispatches[receiver_id][bg]):
                if actual_needed <= 0: break
                donor_data = hosp_dict[d_id]
                donor_surplus = donor_data['inv'][i] - (donor_data['thresholds'][i] + 5)

                if donor_surplus > 0:
                    take = min(actual_needed, donor_surplus, 5)
                    donor_data['inv'][i] -= take
                    rec_data['inv'][i] += take
                    actual_needed -= take
                    updates_needed[d_id], updates_needed[receiver_id] = donor_data['inv'], rec_data['inv']

                    donors_used.append({
                        'donor_id': d_id, 'bg': bg, 'amount': take,
                        'route': route_cache.get((d_id, receiver_id), [[donor_data['lat'], donor_data['lon']],
                                                                       [rec_data['lat'], rec_data['lon']]])
                    })

            # Recruit New Trucks
            if actual_needed > 0:
                for dist, donor_id, donor_name in nearby:
                    if actual_needed <= 0: break
                    if donor_id in active_dispatches[receiver_id][bg]: continue

                    donor_data = hosp_dict[donor_id]
                    donor_surplus = donor_data['inv'][i] - (donor_data['thresholds'][i] + 5)
                    avail_trucks = truck_dict.get(donor_id, {}).get('avail', 0)

                    if donor_surplus > 0 and avail_trucks > 0:
                        truck_dict[donor_id]['avail'] -= 1
                        truck_dict[donor_id]['transit'] += 1
                        trucks_to_update[donor_id] = truck_dict[donor_id]
                        active_dispatches[receiver_id][bg].append(donor_id)

                        add_log(f"🚚 {donor_name} deployed truck to {rec_data['name']} ({bg}).")

                        if (donor_id, receiver_id) not in route_cache:
                            route_cache[(donor_id, receiver_id)] = get_osrm_route(
                                donor_data['lat'], donor_data['lon'], rec_data['lat'], rec_data['lon']
                            )

                        take = min(actual_needed, donor_surplus, 5)
                        donor_data['inv'][i] -= take
                        rec_data['inv'][i] += take
                        actual_needed -= take
                        updates_needed[donor_id], updates_needed[receiver_id] = donor_data['inv'], rec_data['inv']

                        donors_used.append({
                            'donor_id': donor_id, 'bg': bg, 'amount': take,
                            'route': route_cache[(donor_id, receiver_id)]
                        })

        if donors_used:
            active_routes.append({
                'receiver_id': receiver_id, 'rec_lat': rec_data['lat'], 'rec_lon': rec_data['lon'],
                'donors': donors_used
            })

    if updates_needed:
        bulk_data = [(*inv, sum(inv), hid) for hid, inv in updates_needed.items()]
        cursor.executemany("""UPDATE hospitals
                              SET O_pos=?,
                                  O_neg=?,
                                  A_pos=?,
                                  A_neg=?,
                                  B_pos=?,
                                  B_neg=?,
                                  AB_pos=?,
                                  AB_neg=?,
                                  Total_Units=?
                              WHERE id = ?""", bulk_data)
        conn.commit()

    if trucks_to_update:
        truck_data = [(data['avail'], data['transit'], hid) for hid, data in trucks_to_update.items()]
        t_cursor.executemany("UPDATE trucks SET Available_Trucks=?, In_Transit=? WHERE Hospital_id=?", truck_data)
        t_conn.commit()
        pd.read_sql("SELECT * FROM trucks", t_conn).to_csv("truck_availability.csv", index=False)

    conn.close()
    try:
        t_conn.close()
    except:
        pass

    with open('active_routes.json', 'w') as f:
        json.dump(active_routes, f)
    with open('supply_logs.json', 'w') as f:
        json.dump(action_logs, f)


def run_supply_network():
    print("Starting Advanced Supply Engine (Truck Logistics & OSRM Routing)...")
    while True:
        resolve_crises()
        time.sleep(1)


if __name__ == '__main__':
    run_supply_network()