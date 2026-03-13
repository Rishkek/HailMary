import pandas as pd
import numpy as np
import os

# Set how many rows you want to add per run
num_records = 100

# 1. Generate fresh data (random seed removed so it's new every time)
temperature = np.random.uniform(15, 40, num_records).round(1)
rain_mm = np.clip(np.random.exponential(scale=8, size=num_records), 0, 50).round(1)

# Calculate accidents and blood needed based on the weather
base_accidents = np.random.randint(1, 8, num_records)
rain_factor = (rain_mm * 0.5).astype(int)
accidents = base_accidents + rain_factor
blood_needed = (accidents * np.random.uniform(1.5, 3.5, num_records)).astype(int)

# 2. Assemble the data into a Pandas DataFrame
df = pd.DataFrame({
    'Temperature': temperature,
    'Rain_mm': rain_mm,
    'Accidents': accidents,
    'Blood_Needed': blood_needed
})

filename = 'historical_hospital_data.csv'

# 3. Check if the file already exists
file_exists = os.path.isfile(filename)

# 4. Export to CSV in Append mode ('a')
# If the file doesn't exist, it writes the headers. If it does, it skips them.
df.to_csv(filename, mode='a', header=not file_exists, index=False)

# Quick read to see how large the total file is now
total_rows = len(pd.read_csv(filename))

print(f"Success! Appended {num_records} new rows.")
print(f"The '{filename}' file now contains a total of {total_rows} rows.")