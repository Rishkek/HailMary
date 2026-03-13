import sqlite3
import requests
import re

def get_weather_desc(code):
    """Converts standard WMO weather codes into readable text."""
    mapping = {
        0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
        55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
        95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail"
    }
    return mapping.get(code, "Unknown")

# 1. Connect to the database
conn = sqlite3.connect('hospitals.db')
cursor = conn.cursor()

# 2. Add the new columns
new_columns = [("Temperature", "REAL"), ("Weather", "TEXT"), ("Rain_mm", "REAL"), ("Altitude", "REAL")]
for col_name, data_type in new_columns:
    try:
        cursor.execute(f"ALTER TABLE hospitals ADD COLUMN {col_name} {data_type}")
    except sqlite3.OperationalError:
        pass  # Column already exists

# 3. Fetch hospital IDs, NAMES, and locations (added 'name' to the query)
cursor.execute("SELECT id, name, location FROM hospitals")
hospitals = cursor.fetchall()
total_hospitals = len(hospitals)

print(f"Fetching real-time weather for {total_hospitals} hospitals. Please wait...\n")

# 4. Loop through each hospital, using enumerate to keep track of the count
for i, (hospital_id, name, location) in enumerate(hospitals, start=1):
    try:
        # Calculate and format the percentage completion
        percentage = (i / total_hospitals) * 100
        print(f"[{percentage:5.1f}%] ({i}/{total_hospitals}) Fetching: {name}")

        # Use regex to safely extract the latitude and longitude
        coords = re.findall(r"[-+]?\d*\.\d+", str(location))
        if len(coords) < 2:
            print(f"      -> Skipped (Invalid coordinates: {location})")
            continue

        lat, lon = coords[0], coords[1]

        # Ask Open-Meteo for the current temp, precipitation (rain), and weather code
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation,weather_code"
        response = requests.get(url).json()

        if "current" in response:
            temp = response["current"]["temperature_2m"]
            rain = response["current"]["precipitation"]
            weather_code = response["current"]["weather_code"]
            weather_desc = get_weather_desc(weather_code)

            # ---> PUT ALTITUDE EXACTLY HERE <---
            # It grabs "elevation" from the root of the JSON response
            altitude = response.get("elevation", 0.0)

            # Update this specific hospital's row in the database
            cursor.execute("""
                           UPDATE hospitals
                           SET Temperature = ?,
                               Weather     = ?,
                               Rain_mm     = ?,
                               Altitude    = ?
                           WHERE id = ?
                           """, (temp, weather_desc, rain, altitude, hospital_id))

    except Exception as e:
        print(f"      -> Failed to update {name} (ID: {hospital_id}). Error: {e}")

# 5. Save the changes to the file and close the connection
conn.commit()
conn.close()

print("\nSuccess! Your hospitals.db file has been updated with real-time weather data.")