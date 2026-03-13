import sqlite3
import random

def generate_simulation_key():
    # Connect to the database to find out how many hospitals there are
    conn = sqlite3.connect('hospitals.db')
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM hospitals")
    num_hospitals = cursor.fetchone()[0]
    conn.close()

    # Generate a random string of digits from 1 to 7
    # e.g., if there are 100 hospitals, this generates a 100-character string
    sim_key = ''.join(str(random.randint(1, 7)) for _ in range(num_hospitals))

    # Save to key.txt
    with open('key.txt', 'w') as file:
        file.write(sim_key)

    print(f"Simulation key generated for {num_hospitals} hospitals.")
    print(f"Key saved to key.txt")

if __name__ == "__main__":
    generate_simulation_key()