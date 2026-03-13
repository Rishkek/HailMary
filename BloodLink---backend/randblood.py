import sqlite3
import requests
from bs4 import BeautifulSoup
import re
import random
import time

# 1. Blood Group Distribution
DISTRIBUTION = {
    'O_pos': 0.37, 'O_neg': 0.01,
    'A_pos': 0.22, 'A_neg': 0.005,
    'B_pos': 0.32, 'B_neg': 0.005,
    'AB_pos': 0.069, 'AB_neg': 0.001
}


def get_review_count(hospital_name):
    """Scrapes Google Search for the number of reviews."""
    # Disguise the script as a normal Windows Chrome browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    # Format the search query
    query = f"{hospital_name} hospital reviews".replace(" ", "+")
    url = f"https://www.google.com/search?q={query}"

    try:
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract all text from the page
        page_text = soup.get_text()

        # Look for patterns like "1,234 reviews" or "500 reviews"
        match = re.search(r'([0-9,]+)\s+reviews', page_text, re.IGNORECASE)

        if match:
            # Remove commas and convert to an integer
            review_count = int(match.group(1).replace(',', ''))
            return review_count
        return 0  # Fallback if no reviews are found

    except Exception as e:
        print(f"Scrape failed for {hospital_name}: {e}")
        return 0


def categorize_size(review_count):
    """Assigns a category and a random blood unit range based on review count."""
    if review_count > 2000:
        return "Large", random.randrange(500, 601)  # Max 600
    elif review_count > 1000:
        return "Big", random.randrange(400, 500)
    elif review_count > 500:
        return "Moderate", random.randrange(300, 400)
    elif review_count > 200:
        return "Medium", random.randrange(200, 300)
    elif review_count > 50:
        return "Clinic", random.randrange(100, 200)
    else:
        return "Small", random.randrange(30, 100)  # Min 30


# 2. Connect to Database
conn = sqlite3.connect('hospitals.db')
cursor = conn.cursor()

# Ensure Size column exists
try:
    cursor.execute("ALTER TABLE hospitals ADD COLUMN Size TEXT")
except sqlite3.OperationalError:
    pass

# 3. Fetch hospitals
cursor.execute("SELECT id, name FROM hospitals")
hospitals = cursor.fetchall()

print(f"Scraping Google for {len(hospitals)} hospitals. Please wait (this takes time to avoid bans)...\n")

for hosp_id, name in hospitals:
    # 4. Scrape reviews and categorize
    reviews = get_review_count(name)
    size_category, total_units = categorize_size(reviews)

    # 5. Calculate individual blood groups based on distribution
    updates = {}
    for group, percentage in DISTRIBUTION.items():
        updates[group] = round(total_units * percentage)

    actual_total = sum(updates.values())

    # 6. Update Database
    cursor.execute("""
                   UPDATE hospitals
                   SET Size        = ?,
                       O_pos       = ?,
                       O_neg       = ?,
                       A_pos       = ?,
                       A_neg       = ?,
                       B_pos       = ?,
                       B_neg       = ?,
                       AB_pos      = ?,
                       AB_neg      = ?,
                       Total_Units = ?
                   WHERE id = ?
                   """, (
                       size_category,
                       updates['O_pos'], updates['O_neg'],
                       updates['A_pos'], updates['A_neg'],
                       updates['B_pos'], updates['B_neg'],
                       updates['AB_pos'], updates['AB_neg'],
                       actual_total, hosp_id
                   ))

    print(f"[{size_category:8}] {name[:25]:<25} | {reviews:>5} reviews -> {actual_total} units")

    # BE NICE TO GOOGLE: Pause for 2 seconds between requests
    time.sleep(2)

# 7. Finalize
conn.commit()
conn.close()
print("\nSuccess! Database updated using live Google Review data.")