import pandas as pd, sqlite3
pd.read_sql("SELECT * FROM hospitals", sqlite3.connect("hospitals.db")).to_csv("hospitals.csv", index=False)