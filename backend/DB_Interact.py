#File written by Gemini to allow command line interaction with the DB. 
#We were able to use this to verify changes happening to the DB in real time
#like we could with a server hosted SQL product

import sqlite3 as sq
import pandas as pd

def connect_db(db_name):
    """Establishes a connection to the SQLite database."""
    try:
        conn = sq.connect(db_name)
        cur = conn.cursor()
        return conn, cur
    except sq.Error as e:
        print(f"Error connecting to database '{db_name}': {e}")
        return None, None

def interactive_sql_shell(db_name='roster.db'):
    """
    Runs a command-line shell to interact with the specified SQLite database
    in real-time. Runs until a KeyboardInterrupt (Ctrl+C) or exit command.
    """
    
    conn, cur = connect_db(db_name)
    if conn is None or cur is None:
        return # Exit if connection failed

    print(f"--- Connected to '{db_name}' ---")
    print("Type your SQL commands and press Enter.")
    print("Type '.exit' or 'quit' or press Ctrl+C to exit.")
    print("-" * (26 + len(db_name)))

    while True:
        try:
            # 1. Get command from user
            prompt = input("sql> ").strip()

            # 2. Check for exit commands
            if prompt.lower() in ('.exit', 'exit', '.quit', 'quit'):
                print("Exiting...")
                break
            
            # 3. Skip if input is empty
            if not prompt:
                continue

            # 4. Execute the command
            cur.execute(prompt)

            # 5. Handle the results
            # cur.description is None for commands that don't return rows
            # (like INSERT, UPDATE, DELETE, CREATE TABLE)
            if cur.description:
                # It was a SELECT query (or similar)
                rows = cur.fetchall()
                
                if rows:
                    # Print column headers
                    headers = [desc[0] for desc in cur.description]
                    print("\n" + ", ".join(headers))
                    print("-" * (sum(len(h) for h in headers) + len(headers)*2))
                    
                    # Print all rows
                    for row in rows:
                        print(row)
                    print(f"\n({len(rows)} rows returned)")
                else:
                    print("Query executed successfully, no results found.")
            else:
                # It was a modification (INSERT, UPDATE, etc.)
                # We must commit to save the changes
                conn.commit()
                # cur.rowcount shows how many rows were changed
                print(f"Command executed successfully. {cur.rowcount} rows affected.")

        except sq.Error as e:
            # Handle any SQL-specific errors (e.g., syntax error)
            # We print the error and continue the loop
            print(f"An SQL error occurred: {e}")
        
        except KeyboardInterrupt:
            # Handle Ctrl+C
            print("\nExiting...")
            break
        
        except Exception as e:
            # Catch any other unexpected errors
            print(f"An unexpected error occurred: {e}")
            break # Exit loop on unexpected errors

    # 6. Clean up and close connection
    conn.close()
    print(f"Connection to '{db_name}' closed.")


if __name__ == "__main__":
    # To run the interactive shell, call this function.
    # It will use 'roster.db' by default.
    interactive_sql_shell('roster.db')

    # --- Example of how your other code might look ---
    # (Commented out so the shell runs first)

    # print("\n--- Running original script logic (example) ---")
    # data, teacherData = load_df('StdInfo.xlsx') # Assuming load_df exists
    # if data:
    #     populate_db('roster.db', data) # Assuming populate_db exists
    #     print("Database populated.") 
