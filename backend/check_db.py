import sqlite3

conn = sqlite3.connect('roster.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cur.fetchall()]
print("Tables in roster.db:", tables)

for table in tables:
    print(f"\nColumns in {table}:")
    cur.execute(f"PRAGMA table_info({table})")
    columns = cur.fetchall()
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    count = cur.fetchone()[0]
    print(f"  Total rows: {count}")

conn.close()
