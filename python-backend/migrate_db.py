import sqlite3

def migrate():
    conn = sqlite3.connect('stores.db')
    c = conn.cursor()
    
    # Check if columns already exist
    c.execute("PRAGMA table_info(stores)")
    columns = [col[1] for col in c.fetchall()]
    
    new_cols = [
        ('q1', 'TEXT'), ('a1', 'TEXT'),
        ('q2', 'TEXT'), ('a2', 'TEXT'),
        ('q3', 'TEXT'), ('a3', 'TEXT')
    ]
    
    for col_name, col_type in new_cols:
        if col_name not in columns:
            print(f"Adding column {col_name}...")
            c.execute(f"ALTER TABLE stores ADD COLUMN {col_name} {col_type}")
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
