import sqlite3
import pandas as pd
import os
import random
import time

# Dictionary to determine how many trucks a hospital gets based on its size digit
# Format: 'Digit': (Min_Trucks, Max_Trucks)
TRUCK_LIMITS = {
    '0': (0, 0),  # Small
    '1': (1, 2),  # Clinic
    '2': (3, 5),  # Medium
    '3': (6, 9),  # Moderate
    '4': (10, 14),  # Big
    '5': (15, 20)  # Large (Max 20)
}


def get_truck_key():
    if not os.path.exists('truck_key.txt'):
        print("Error: truck_key.txt not found. Run truck_key_generator.py first.")
        return None
    with open('truck_key.txt', 'r') as file:
        return file.read().strip()


def initialize_database(truck_key):
    """Creates the truck DB if it doesn't exist and assigns max fleet sizes."""
    hosp_conn = sqlite3.connect('hospitals.db')
    hosp_cursor = hosp_conn.cursor()
    hosp_cursor.execute("SELECT id, name FROM hospitals ORDER BY id")
    hospitals = hosp_cursor.fetchall()
    hosp_conn.close()

    conn = sqlite3.connect('truck_availability.db')
    cursor = conn.cursor()

    cursor.execute("""
                   CREATE TABLE IF NOT EXISTS trucks
                   (
                       Hospital_id
                       INTEGER
                       PRIMARY
                       KEY,
                       Hospital_name
                       TEXT,
                       Max_Trucks
                       INTEGER,
                       Available_Trucks
                       INTEGER,
                       In_Transit
                       INTEGER
                   )
                   """)

    # Check if data already exists to avoid overwriting ongoing fleets
    cursor.execute("SELECT COUNT(*) FROM trucks")
    if cursor.fetchone()[0] == 0:
        print("Initializing new truck fleets for all hospitals...")
        fleet_data = []
        for index, row in enumerate(hospitals):
            hid = row[0]
            name = row[1]

            digit = truck_key[index] if index < len(truck_key) else '2'
            limits = TRUCK_LIMITS.get(digit, (3, 5))

            # Generate the fleet size based on the limits
            max_trucks = random.randint(limits[0], limits[1])

            # Initially, all trucks are parked and available
            fleet_data.append((hid, name, max_trucks, max_trucks, 0))

        cursor.executemany("INSERT INTO trucks VALUES (?, ?, ?, ?, ?)", fleet_data)
        conn.commit()

    conn.close()


def update_csv():
    conn = sqlite3.connect("truck_availability.db")
    pd.read_sql("SELECT * FROM trucks", conn).to_csv("truck_availability.csv", index=False)
    conn.close()


def run_truck_controller():
    truck_key = get_truck_key()
    if not truck_key:
        return

    initialize_database(truck_key)
    update_csv()
    print("🚚 Truck Controller running. Fleets initialized and CSV updated.")

    # In the future, this loop will listen to supply_pipe.py to dispatch trucks
    while True:
        # Currently just keeps the CSV synced
        update_csv()
        time.sleep(2)


if __name__ == "__main__":
    run_truck_controller()