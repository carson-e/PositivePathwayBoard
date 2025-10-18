import sqlite3 as sq
import pandas as pd
import string
import traceback
import sys

def connect_db(db_name):        #Connects to roster.db, creates the db if one doesnt exist
    try:
        conn = sq.connect(db_name)
        cur = conn.cursor()
        return conn, cur
    except Exception as e:
        print("Error connecting to database:")
        traceback.print_exc()
        raise e


def build_table(conn=None, cur=None):        #creates roster table in roster.db if doesnt already exist,
    close_conn = False                       #built to handle its own connections so there are no memory leaks
    try:
        if conn is None and cur is None:
            conn, cur = connect_db('roster.db')        #connects to db, conn and cur needed to pass objects in
            close_conn = True
                                                        #cur is what you use to actually pass objects in
        cur.execute("""                        
            CREATE TABLE IF NOT EXISTS roster(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fname TEXT NOT NULL,
                lname TEXT NOT NULL,
                p1_email TEXT,
                p2_email TEXT,
                class_num INTEGER NOT NULL
            )
        """)
        conn.commit()                                #have to commit changes to the db after
    except Exception as e:
        print("Error building table:")
        traceback.print_exc()
        raise e
    finally:
        if close_conn:                    #closes own connection
            conn.close()


def load_df(filepath):                #loads and preprocesses excel sheet, sheet itself has underwent changes
    try:
        roster = pd.read_excel(filepath, usecols='A:I', header=0, sheet_name=None)
        teacherData = pd.read_excel(filepath, usecols='G:J', header=0, sheet_name=0)    #teacher data in different df, not currently used

        for sheet_name, df in roster.items():        #since eventually i want to read in multiple sheets for each class, this is built to read in roster
            classNum = sheet_name.split(' ')[1]      #if it is a dictionary of sheets. <- This line reads the sheet name and pulls the class number from it
            df = df.dropna(subset=["Student Name"])    #drops empty entries
            df[["fname", "lname"]] = df["Student Name"].str.split(' ', n=1, expand=True)        #inserts two new columns, splitting the Student Name column for db

            print(f"Sheet name: {sheet_name}")
            print("Data loaded successfully.")
            df.rename(columns={"Parent 1 Email": "p1_email", "Parent 2 Email": "p2_email"}, inplace=True)       #renames cols for db
            df["class_num"] = classNum
            df = df[["fname", "lname", "p1_email", "p2_email", "class_num"]]    #drops photo, parent names for now
            print(df.head())

            roster[sheet_name] = df

        print("Teacher Data:\n", teacherData.head())
        return roster, teacherData

    except FileNotFoundError:
        print(f"File not found: {filepath}")
        traceback.print_exc()
        return None, None
    except ImportError as e:
        print(e)
        return None, None
    except Exception as e:
        print("Error occurred while loading Excel file:")
        traceback.print_exc()
        return None, None



def populate_db(db_name, data, conn=None, cur=None):       #fills DB, does not really work rn
    close_end = False                                      #has issues either with connecting or filling or something idk
    try:
        if conn is None and cur is None:
            conn, cur = connect_db(db_name)
            close_end = True

        if isinstance(data, dict):
            inserted = 0
            for sheets, df in data.items():
                for _, row in df.iterrows():       #inserts data into df 
                    cur.execute("""
                        INSERT INTO roster (fname, lname, p1_email, p2_email, class_num)
                        VALUES (?, ?, ?, ?, ?)
                    """, (row['fname'], row['lname'], row['p1_email'], row['p2_email'], row['class_num']))    # Question marks are to protect against SQL Injection
                    inserted += 1

            conn.commit()
            return inserted
        else:
            print("No data to populate (data is not a dict). Skipping population.")
            return 0

    except Exception as e:
        print("Error occurred while populating database:")
        traceback.print_exc()
        raise e
    finally:
        if close_end:
            conn.close()


if __name__ == "__main__":
    try:
        build_table()
        data, teacherData = load_df('StdInfo.xlsx')
        if data is None:
            print("Data could not be loaded. Exiting.")
            sys.exit(1)

        conn, cur = connect_db('roster.db')
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        print("Tables:", cur.fetchall())
        conn.close()

        inserted = populate_db('roster.db', data)
        print(f"Inserted rows: {inserted}")

        conn, cur = connect_db('roster.db')
        cur.execute('SELECT * FROM roster')
        rows = cur.fetchall()
        for row in rows:
            print(row)

        conn.close()

    except Exception as e:
        print("Fatal error in main execution:")
        traceback.print_exc()
        sys.exit(1)
