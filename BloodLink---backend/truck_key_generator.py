import sqlite3
import os

# The mapping scale based on your rules
SIZE_MAP = {
    "Small": "0",
    "Clinic": "1",
    "Medium": "2",
    "Moderate": "3",
    "Big": "4",
    "Large": "5"
}


def generate_truck_key():
    conn = sqlite3.connect('hospitals.db')
    cursor = conn.cursor()

    # Fetch all hospitals ordered by ID to maintain sequence
    cursor.execute("SELECT id, Size FROM hospitals ORDER BY id")
    hospitals = cursor.fetchall()

    key_digits = []

    for row in hospitals:
        size = row[1] if row[1] else "Medium"  # Fallback to Medium if size is somehow missing
        digit = SIZE_MAP.get(size, "2")
        key_digits.append(digit)

    truck_key = "".join(key_digits)

    with open('truck_key.txt', 'w') as f:
        f.write(truck_key)

    print(f"✅ Generated truck_key.txt for {len(hospitals)} hospitals.")
    print(f"Key preview: {truck_key[:20]}...")

    conn.close()


if __name__ == "__main__":
    generate_truck_key()