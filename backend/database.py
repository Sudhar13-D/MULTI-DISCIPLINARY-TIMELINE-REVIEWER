import os
import sqlite3
from typing import Generator
from contextlib import contextmanager

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "clinical_mdt.db"))

def get_db_connection() -> sqlite3.Connection:
    """Returns a connection to the SQLite database with WAL mode and row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initializes tables in the SQLite database if they do not exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            department TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)

        # 2. Sessions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 3. Patient Cases Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            patient_de_id TEXT NOT NULL,
            age INTEGER NOT NULL,
            sex TEXT NOT NULL,
            primary_dx TEXT NOT NULL,
            referring_dept TEXT NOT NULL,
            urgency TEXT NOT NULL,
            decision_required_by_hours INTEGER NOT NULL,
            complexity TEXT NOT NULL,
            baseline_minutes INTEGER NOT NULL,
            target_minutes INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            next_action TEXT,
            created_at TEXT NOT NULL
        );
        """)

        # 4. Timeline Events Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS timeline_events (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            subtype TEXT NOT NULL,
            specimen_id TEXT,
            result_date TEXT NOT NULL,
            received_date TEXT NOT NULL,
            evidence_state TEXT NOT NULL,
            is_preliminary INTEGER NOT NULL DEFAULT 0,
            is_final INTEGER NOT NULL DEFAULT 1,
            freshness_threshold_days INTEGER NOT NULL,
            is_stale INTEGER NOT NULL DEFAULT 0,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            full_report TEXT,
            report_id TEXT,
            visible_roles TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
        );
        """)

        # 5. Specimens Table (Hierarchical Lineage)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS specimens (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            label TEXT NOT NULL,
            type TEXT NOT NULL,
            parent_id TEXT,
            status TEXT NOT NULL,
            collection_date TEXT NOT NULL,
            anatomic_site TEXT,
            notes TEXT,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES specimens(id)
        );
        """)

        # 6. Binding MDT Decisions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS decisions (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            submitted_by_user_id TEXT NOT NULL,
            decision_text TEXT NOT NULL,
            treatment_pathway TEXT NOT NULL,
            consensus_level TEXT NOT NULL,
            contingency_action TEXT,
            evidence_reviewed TEXT NOT NULL,
            stale_risk_acknowledged INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'binding',
            created_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (submitted_by_user_id) REFERENCES users(id)
        );
        """)

        # 7. Audit Trail Logs Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            case_id TEXT,
            user_id TEXT,
            user_email TEXT NOT NULL,
            user_role TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            status TEXT NOT NULL,
            ip_address TEXT,
            timestamp TEXT NOT NULL
        );
        """)

        # 8. Document & Scan Attachments Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            specimen_id TEXT,
            uploaded_by_user_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            category TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
            FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
        );
        """)

        # 9. In-App Notifications Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            case_id TEXT,
            recipient_role TEXT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            category TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        """)
        
    print("Clinical MDT Database initialized successfully.")

if __name__ == "__main__":
    init_db()
