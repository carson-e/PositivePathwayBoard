#This is the meat of the backend functions

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
        
        try:
            # Load student data from columns A:H
            roster_full = pd.read_excel(filepath, usecols='A:H', header=0, sheet_name=None)
            # Load teacher data from columns I:L (which includes Teacher Name, Grade, Room Number)
            teacherData = pd.read_excel(filepath, usecols='I:L', header=0, sheet_name=0)
            
            print(f"Teacher Data columns: {teacherData.columns.tolist()}")
            print(f"Teacher Data first row:\n{teacherData.head(1)}")
            
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

        # Create a new dictionary to store the processed DataFrames
        roster_processed = {}
        teacher_info = {"Teacher Name": None, "Grade": None}
        
        # Try to extract teacher info from teacherData DataFrame first
        if not teacherData.empty:
            print("Extracting teacher info from teacherData DataFrame")
            if 'Teacher Name' in teacherData.columns:
                teacher_value = teacherData['Teacher Name'].iloc[0]
                if pd.notna(teacher_value) and str(teacher_value).strip():
                    teacher_info["Teacher Name"] = str(teacher_value).strip()
                    print(f"  Found Teacher Name: {teacher_info['Teacher Name']}")
            if 'Grade' in teacherData.columns:
                grade_value = teacherData['Grade'].iloc[0]
                if pd.notna(grade_value) and str(grade_value).strip():
                    teacher_info["Grade"] = str(grade_value).strip()
                    print(f"  Found Grade: {teacher_info['Grade']}")

        # Loop through the original dictionary
        for sheet_name, df in roster_full.items():
            print(f"Processing sheet: {sheet_name}")

            # Also try to extract Teacher Name and Grade from the first row if present in the sheet
            # (This is a fallback in case teacherData is empty)
            if not teacher_info["Teacher Name"] and 'Teacher Name' in df.columns:
                teacher_value = df['Teacher Name'].iloc[0]
                # Handle NaN, None, or empty string
                if pd.notna(teacher_value) and str(teacher_value).strip():
                    teacher_info["Teacher Name"] = str(teacher_value).strip()
                    print(f"  Extracted Teacher Name from sheet: {teacher_info['Teacher Name']}")
            if not teacher_info["Grade"] and 'Grade' in df.columns:
                grade_value = df['Grade'].iloc[0]
                # Handle NaN, None, or empty string
                if pd.notna(grade_value) and str(grade_value).strip():
                    teacher_info["Grade"] = str(grade_value).strip()
                    print(f"  Extracted Grade from sheet: {teacher_info['Grade']}")

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

def clear_roster_tables(db_name, conn=None, cur=None, clear_taps=False):
    """Clear all student roster tables from the database.
    
    Args:
        db_name: Name of the database
        conn, cur: Optional existing connection/cursor
        clear_taps: If True, also drops the taps table (for fresh start from Excel)
    """
    close_end = False
    if conn is None and cur is None:
        conn, cur = connect_db(db_name)
        close_end = True

    try:
        # Get all table names
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        all_tables = [row[0] for row in cur.fetchall()]
        
        # Tables to preserve (don't delete these)
        preserve_tables = {'metadata', 'sqlite_sequence'}
        
        # Optionally preserve taps table if we're not doing a complete fresh start
        if not clear_taps:
            preserve_tables.add('taps')
        
        # Drop all tables except the ones we want to preserve
        for table in all_tables:
            if table not in preserve_tables:
                print(f"Dropping table: {table}")
                cur.execute(f'DROP TABLE IF EXISTS "{table}"')
        
        conn.commit()
        print("Roster tables cleared successfully.")
    finally:
        if close_end:
            conn.close()

#populate_db SHOULD work as a flush for initialization, can call first and then again for new info
def populate_db(db_name, data, conn=None, cur=None, teacher_info=None, clear_first=False, clear_taps=False):
    """Populates the database with data from a dictionary of DataFrames.
    
    Args:
        db_name: Name of the database file
        data: Dictionary of DataFrames to insert
        conn, cur: Optional existing connection/cursor
        teacher_info: Dictionary with teacher name and grade
        clear_first: If True, removes all old roster tables before inserting new data
        clear_taps: If True, also removes the taps table (only used with clear_first=True)
    """
    close_end = False
    if conn is None and cur is None:
        conn, cur = connect_db(db_name)
        close_end = True

    # Clear old roster tables if requested (preserves metadata, optionally preserves taps)
    if clear_first:
        clear_roster_tables(db_name, conn=conn, cur=cur, clear_taps=clear_taps)

    if isinstance(data, dict):
        for sheet_name, df in data.items():
            print(f"Inserting data from sheet into table: {sheet_name}")
            
            # Use 'replace' to avoid duplicating data
            # 'append' will just add the same data again.
            df.to_sql(sheet_name, conn, if_exists='replace', index=False)
            
    else:
        # This part might not be needed if 'data' is always a dict
        print(f"Inserting data into table: {db_name}")
        data.to_sql(db_name, conn, if_exists='replace', index=False)

    # Store teacher info in a metadata table if provided
    if teacher_info:
        print(f"Storing teacher info in metadata table: {teacher_info}")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')
        
        teacher_name = teacher_info.get('Teacher Name')
        grade = teacher_info.get('Grade')
        
        if teacher_name:
            cur.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', 
                       ('teacher_name', str(teacher_name)))
            print(f"  Saved teacher_name: {teacher_name}")
        else:
            print("  Warning: Teacher Name is None or empty, not saving")
            
        if grade:
            cur.execute('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', 
                       ('grade', str(grade)))
            print(f"  Saved grade: {grade}")
        else:
            print("  Warning: Grade is None or empty, not saving")

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

#testing to ensure it works
if __name__ == "__main__":
    
    # build_table()
    data, teacherData, teacher_info = load_df('StdInfo.xlsx')

    conn, cur = connect_db('roster.db')
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print(cur.fetchall())
    conn.close()

    populate_db('roster.db', data, teacher_info=teacher_info)

    # conn, cur = connect_db('roster.db')
    # cur.execute('DROP table roster')
    # rows = cur.fetchall()
    # for row in rows:
    #     print(row)

    conn.close()
