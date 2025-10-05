import pandas as pd
import numpy as np
import datetime as dt
import os
import sqlite3 as sq3  #Will try to switch to this eventually, pandas df is a proof of concept more than anything

#Placeholders for actual character EQs, just needed to verify the date grabbed right
character_eqs = [
    "School year begins!",     # August
    "Fall is here.",           # September
    "Spooky season!",          # October
    "Thanksgiving vibes.",     # November
    "Holiday cheer.",          # December
    "New year, new start.",    # January
    "Winter continues.",       # February
    "Spring is coming.",       # March
    "Flowers bloom.",          # April
    "School year wraps up!"    # May
]

def cycle_CEQ(character_eqs):
    today = dt.datetime.today()
    #settoday = dt.datetime(2025, 3, 15)  # Hardcoded date for testing purposes
    print(today)
    month = today.month
    print(month)

    if 8 <= month <= 12:
        return print(character_eqs[month-8])
    elif 1 <= month <= 5:
        return print(character_eqs[month + 4])
    else:
        return "No Character EQ this month."
    
cycle_CEQ(character_eqs)


"""Function to load data from the excel template,
modified to take only columns A thru I. Will need extra modifications once we start bulk importing.

Had to modify the excel sheet to bring teacher column in line with rest, needs to be modified in future."""
def load_df(filepath):

    try:
        df = pd.read_excel(filepath, usecols = 'A:I', header = 0)
        print("Data loaded successfully.")
        print(df.head())
        return df
    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


#load_df(r"C:\Users\oakes\Desktop\StdInfo.xlsx")
#Modify filepath as needed