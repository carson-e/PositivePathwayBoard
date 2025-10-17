import sqlite3 as sq
import pandas as pd

def connect_db(db_name):

    conn = sq.connect(db_name)
    cur = conn.cursor()

    return conn, cur


def build_table(conn = None, cur = None):
    close_conn = False
    if conn is None and cur is None:
        conn, cur = connect_db('roster.db')
        close_conn = True
    cur.execute("CREATE TABLE IF NOT EXISTS roster(id INTEGER PRIMARY KEY AUTOINCREMENT, fname TEXT NOT NULL, lname TEXT NOT NULL, p1_email TEXT, p2_email text, class_num INTEGER NOT NULL)")
    conn.commit()
    #res = cur.execute("SELECT * FROM sqlite_master")
    #res.fetchall()
    if close_conn:
        conn.close()
    #print(res)

def load_df(filepath):
    try:
        
        roster = pd.read_excel(filepath, usecols='A:I', header=0, sheet_name=None)

        teacherData = pd.read_excel(filepath, usecols='G:J', header=0, sheet_name=0)

        for sheet_name, df in roster.items():
            print(f"Sheet name: {sheet_name}")
            print("Data loaded successfully.")
            print(df.head())

        print("Teacher Data:\n", teacherData.head())
        return roster, teacherData

    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return None, None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None

def populate_db(db_name, data, conn=None, cur=None):
    close_end = False
    if conn is None and cur is None:
        conn, cur = connect_db(db_name)
        close_end = True

    if isinstance(data, dict):
        for sheet_name, df in data.items():
            print(f"Inserting data from sheet: {sheet_name}")
            df.to_sql('roster', conn, if_exists='append', index=False)
    else:
        data.to_sql('roster', conn, if_exists='replace', index=False)

    conn.commit()

    if close_end:
        conn.close()



if __name__ == "__main__":
    
    build_table()
    data, teacherData = load_df('StdInfo.xlsx')

    conn, cur = connect_db('roster.db')
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cur.fetchall())
    conn.close()

    populate_db('roster.db', data)

    conn, cur = connect_db('roster.db')
    cur.execute('SELECT * FROM roster')
    rows = cur.fetchall()
    for row in rows:
        print(row)

    conn.close()



