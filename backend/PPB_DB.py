import sqlite3 as sq
import pandas as pd
import json
import os

def connect_db(db_name):

    conn = sq.connect(db_name)
    cur = conn.cursor()

    return conn, cur

def load_df(filepath):
    """Loads all sheets from an Excel file and processes them."""
    try:
        # Load all sheets into a dictionary of DataFrames
        # roster_full = pd.read_excel(filepath, usecols='A:I', header=0, sheet_name=None)

        # Load teacher data from the first sheet
        # teacherData = pd.read_excel(filepath, usecols='G:J', header=0, sheet_name=0)

        # First, try to load with original column spec (A:I)
        try:
            roster_full = pd.read_excel(filepath, usecols='A:H', header=0, sheet_name=None)
            teacherData = pd.read_excel(filepath, usecols='I:L', header=0, sheet_name=0)
        except ValueError as e:
            # If that fails, load all columns with header=None (no header row)
            print(f"Warning: Could not load columns A:I, loading all columns with no header: {e}")
            roster_full = pd.read_excel(filepath, header=None, sheet_name=None)
            teacherData = pd.DataFrame()  # Empty if can't load teacher data
            
            # Rename columns to standard names for easier access
            for sheet_name, df in roster_full.items():
                if len(df.columns) >= 2:
                    # Assume first column is name, second is unused, rest are contact info
                    col_names = ['fname', 'lname'] if len(df.columns) >= 2 else ['name']
                    if len(df.columns) > 2:
                        col_names.extend([f'contact_{i}' for i in range(len(df.columns) - 2)])
                    df.columns = col_names[:len(df.columns)]
                    roster_full[sheet_name] = df

        # --- THIS IS THE FIX ---
        # Create a new dictionary to store the processed DataFrames
        roster_processed = {}
        teacher_info = {"Teacher Name": None, "Grade": None}

        # Loop through the original dictionary
        for sheet_name, df in roster_full.items():
            print(f"Processing sheet: {sheet_name}")

            # Extract Teacher Name and Grade from the first row if present
            if 'Teacher Name' in df.columns:
                teacher_info["Teacher Name"] = df['Teacher Name'].iloc[0]
            if 'Grade' in df.columns:
                teacher_info["Grade"] = df['Grade'].iloc[0]

            # Drop the columns from the individual DataFrame (df)
            columns_to_drop = ['Teacher Name', 'Grade', 'Room Number']
            existing_cols_to_drop = [col for col in columns_to_drop if col in df.columns]
            if existing_cols_to_drop:
                roster_processed[sheet_name] = df.drop(columns=existing_cols_to_drop)
                print(f"  Dropped columns: {existing_cols_to_drop}")
            else:
                roster_processed[sheet_name] = df
                print("  No columns to drop.")

            print("  Data processed successfully.")
            print(roster_processed[sheet_name].head())
        # --- END OF FIX ---

        print("\nTeacher Data:\n", teacherData.head() if not teacherData.empty else "No teacher data")
        print("Teacher Info:", teacher_info)

        # Return the new dictionary with the processed DataFrames and teacher info
        return roster_processed, teacherData, teacher_info

    except FileNotFoundError:
        print(f"File not found: {filepath}")
        return None, None, None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None, None, None

#populate_db SHOULD work as a flush for initialization, can call first and then again for new info
def populate_db(db_name, data, conn=None, cur=None):
    """Populates the database with data from a dictionary of DataFrames."""
    close_end = False
    if conn is None and cur is None:
        conn, cur = connect_db(db_name)
        close_end = True

    if isinstance(data, dict):
        for sheet_name, df in data.items():
            print(f"Inserting data from sheet into table: {sheet_name}")
            
            # Recommendation: Use 'replace' to avoid duplicating data
            # if you run the script multiple times.
            # 'append' will just add the same data again.
            df.to_sql(sheet_name, conn, if_exists='replace', index=False)
            
    else:
        # This part might not be needed if 'data' is always a dict
        print(f"Inserting data into table: {db_name}")
        data.to_sql(db_name, conn, if_exists='replace', index=False)

    conn.commit()
    print("\nDatabase populated successfully.")

    if close_end:
        conn.close()

#converts to JSON, used to push data to front end
def push_db(db_name, table_name, conn = None, cur = None):
    """Export a single table from the SQLite database to a JSON file.

    Args:
        db_name (str): Path to the SQLite database file.
        table_name (str): Name of the table to export.
        conn, cur: Optional existing connection/cursor. If omitted, a new connection is opened.

    Returns:
        str: Path to the written JSON file.
    """
    close_end = False
    if conn is None and cur is None:
        conn, cur = connect_db(db_name)
        close_end = True

    try:
        # verify table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
        if not cur.fetchone():
            raise ValueError(f"Table '{table_name}' does not exist in database '{db_name}'")

        # Quote the table name to allow spaces/special chars
        safe_table = '"' + table_name.replace('"', '""') + '"'
        cur.execute(f"SELECT * FROM {safe_table}")
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()

        out_filename = f"{table_name}.json"
        out_path = os.path.abspath(out_filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            data = [dict(zip(cols, row)) for row in rows]
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Exported {len(rows)} rows from '{table_name}' to {out_path}")
        return out_path
    finally:
        if close_end:
            conn.close()
#writes taps, record keeping per student, not quite persistent


if __name__ == "__main__":
    
    # build_table()
    data, teacherData, teacher_info = load_df('StdInfo.xlsx')

    conn, cur = connect_db('roster.db')
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cur.fetchall())
    conn.close()

    populate_db('roster.db', data)

    # conn, cur = connect_db('roster.db')
    # cur.execute('DROP table roster')
    # rows = cur.fetchall()
    # for row in rows:
    #     print(row)

    conn.close()
