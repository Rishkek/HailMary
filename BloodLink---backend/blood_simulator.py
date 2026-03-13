import sqlite3
import time
import random
import pandas as pd
import os

BLOOD_GROUPS = ['O_pos', 'O_neg', 'A_pos', 'A_neg', 'B_pos', 'B_neg', 'AB_pos', 'AB_neg']

DISTRIBUTION = [0.37, 0.01, 0.22, 0.005, 0.32, 0.005, 0.069, 0.001]

SIMULATION_PROFILES = {
    '1': {'use_prob': 0.50, 'don_prob': 0.15, 'use_min': 1, 'use_max': 2, 'don_min': 15, 'don_max': 30},
    '2': {'use_prob': 0.60, 'don_prob': 0.12, 'use_min': 1, 'use_max': 3, 'don_min': 15, 'don_max': 25},
    '3': {'use_prob': 0.70, 'don_prob': 0.10, 'use_min': 1, 'use_max': 3, 'don_min': 10, 'don_max': 25},
    '4': {'use_prob': 0.80, 'don_prob': 0.08, 'use_min': 2, 'use_max': 4, 'don_min': 10, 'don_max': 20},
    '5': {'use_prob': 0.85, 'don_prob': 0.05, 'use_min': 2, 'use_max': 5, 'don_min': 10, 'don_max': 20},
    '6': {'use_prob': 0.90, 'don_prob': 0.03, 'use_min': 3, 'use_max': 6, 'don_min': 10, 'don_max': 15},
    '7': {'use_prob': 0.95, 'don_prob': 0.01, 'use_min': 4, 'use_max': 8, 'don_min': 5, 'don_max': 15},
}

MIN_REQUIREMENTS = {
    "Large": 150, "Big": 100, "Moderate": 75,
    "Medium": 50, "Clinic": 25, "Small": 10
}


def update_csv():
    conn = sqlite3.connect("hospitals.db")
    pd.read_sql("SELECT * FROM hospitals", conn).to_csv("hospitals.csv", index=False)
    conn.close()


def get_simulation_key():
    if not os.path.exists('key.txt'):
        return None
    with open('key.txt', 'r') as file:
        return file.read().strip()


def simulate_blood_flow(sim_key):
    conn = sqlite3.connect('hospitals.db')
    cursor = conn.cursor()

    cursor.execute(f"SELECT id, name, Size, {', '.join(BLOOD_GROUPS)} FROM hospitals ORDER BY id")
    hospitals = cursor.fetchall()

    bulk_update_data = []
    tickets = []

    for index, hospital in enumerate(hospitals):
        hosp_id = hospital[0]
        hosp_name = hospital[1]
        hosp_size = hospital[2] if hospital[2] else 'Medium'

        hospital_sim_digit = sim_key[index] if index < len(sim_key) else '3'
        profile = SIMULATION_PROFILES.get(hospital_sim_digit, SIMULATION_PROFILES['3'])

        inventory = list(hospital[3:])
        needs_ticket = False

        base_required = MIN_REQUIREMENTS.get(hosp_size, 50)

        for i in range(len(BLOOD_GROUPS)):
            type_threshold = max(1, int(base_required * DISTRIBUTION[i]))

            if random.random() < profile['use_prob']:
                used_amount = random.randint(profile['use_min'], profile['use_max'])
                inventory[i] = max(0, inventory[i] - used_amount)

            if random.random() < profile['don_prob']:
                donated_amount = random.randint(profile['don_min'], profile['don_max'])
                inventory[i] += donated_amount

            if inventory[i] < type_threshold:
                needs_ticket = True

        new_total = sum(inventory)
        bulk_update_data.append((*inventory, new_total, hosp_id))

        if needs_ticket:
            ticket_data = {
                "Sl.no": hosp_id,
                "Hospital Name": hosp_name,
                "Total Required": 0
            }

            total_req = 0

            for i, bg in enumerate(BLOOD_GROUPS):
                type_threshold = max(1, int(base_required * DISTRIBUTION[i]))
                req_amount = type_threshold + 10 if inventory[i] < type_threshold else 0
                ticket_data[f"Req_{bg}"] = req_amount
                total_req += req_amount

            ticket_data["Total Required"] = total_req
            tickets.append(ticket_data)

    cursor.executemany("""
                       UPDATE hospitals
                       SET O_pos=?,
                           O_neg=?,
                           A_pos=?,
                           A_neg=?,
                           B_pos=?,
                           B_neg=?,
                           AB_pos=?,
                           AB_neg=?,
                           Total_Units=?
                       WHERE id = ?
                       """, bulk_update_data)
    conn.commit()
    conn.close()

    if tickets:
        pd.DataFrame(tickets).to_csv("ticket.csv", index=False)
    else:
        if os.path.exists("ticket.csv"):
            os.remove("ticket.csv")


if __name__ == "__main__":
    sim_key = get_simulation_key()
    if sim_key:
        # Initial run
        simulate_blood_flow(sim_key)
        update_csv()
        print("DONE")

        try:
            while True:
                time.sleep(60)
                simulate_blood_flow(sim_key)
                update_csv()
                print("DONE")
        except KeyboardInterrupt:
            pass