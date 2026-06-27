import sqlite3
import os

DB_PATH = os.environ.get("DB_PATH", "route53.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS hosted_zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zone_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            comment TEXT DEFAULT '',
            type TEXT DEFAULT 'Public',
            record_count INTEGER DEFAULT 0,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS dns_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT UNIQUE NOT NULL,
            zone_id TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            value TEXT NOT NULL,
            ttl INTEGER DEFAULT 300,
            routing_policy TEXT DEFAULT 'Simple',
            comment TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (zone_id) REFERENCES hosted_zones(zone_id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_zones_user ON hosted_zones(user_id);
        CREATE INDEX IF NOT EXISTS idx_records_zone ON dns_records(zone_id);
    """)

    # Seed a demo user
    from app.utils.auth_utils import hash_password
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO users (email, password_hash, name) VALUES (?, ?, ?)",
            ("demo@route53clone.com", hash_password("Demo@12345"), "Demo User")
        )
    except Exception:
        pass

    conn.commit()
    conn.close()
