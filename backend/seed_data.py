import os
import json
from datetime import datetime, timezone
from database import init_db, get_db
from auth import hash_password

INITIAL_USERS = [
    {
        "id": "usr-chair",
        "email": "prof.adams@hospital.org",
        "password": "HospitalSecure2024!",
        "full_name": "Prof. E. Adams, MD",
        "role": "chair",
        "department": "Medical Oncology",
    },
    {
        "id": "usr-coord",
        "email": "sarah.mdt@hospital.org",
        "password": "HospitalSecure2024!",
        "full_name": "Sarah Jenkins, RN",
        "role": "coordinator",
        "department": "Cancer Services MDT",
    },
    {
        "id": "usr-rad",
        "email": "dr.chen@hospital.org",
        "password": "HospitalSecure2024!",
        "full_name": "Dr. S. Chen, FRCR",
        "role": "radiologist",
        "department": "Diagnostic Radiology",
    },
    {
        "id": "usr-path",
        "email": "dr.okafor@hospital.org",
        "password": "HospitalSecure2024!",
        "full_name": "Dr. M. Okafor, FRCPath",
        "role": "pathologist",
        "department": "Cellular Pathology",
    },
    {
        "id": "usr-mol",
        "email": "dr.farooqi@hospital.org",
        "password": "HospitalSecure2024!",
        "full_name": "Dr. L. Farooqi, PhD",
        "role": "molecular",
        "department": "Molecular Diagnostics",
    },
    {
        "id": "usr-clin",
        "email": "dr.nair@hospital.org",
        "password": "HospitalSecure2024!",
        "full_name": "Dr. R. Nair, FRCP",
        "role": "clinician",
        "department": "Respiratory Medicine",
    },
]

def seed():
    init_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()

        # Seed Users
        for u in INITIAL_USERS:
            pwd_hash, salt = hash_password(u["password"])
            cursor.execute("""
                INSERT OR REPLACE INTO users (id, email, password_hash, salt, full_name, role, department, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (u["id"], u["email"], pwd_hash, salt, u["full_name"], u["role"], u["department"], now_iso))

        # Load cases from test_cases.json
        test_cases_path = os.path.join(os.path.dirname(__file__), "..", "data-generation", "test_cases.json")
        if not os.path.exists(test_cases_path):
            from generate_test_cases import create_test_cases
            create_test_cases()

        with open(test_cases_path, "r", encoding="utf-8") as f:
            cases = json.load(f)

        for c in cases:
            case_id = c["case_id"]
            cursor.execute("""
                INSERT OR REPLACE INTO cases (
                    id, patient_de_id, age, sex, primary_dx, referring_dept,
                    urgency, decision_required_by_hours, complexity,
                    baseline_minutes, target_minutes, status, next_action, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                case_id,
                c["patient_de_id"],
                c["age"],
                c["sex"],
                c["primary_dx"],
                c["referring_dept"],
                c["urgency"],
                c["decision_required_by_hours"],
                c["complexity"],
                c["baseline_minutes"],
                c["target_minutes"],
                "active",
                f"Awaiting MDT Review ({c['urgency'].upper()})",
                now_iso
            ))

            # Seed Timeline Events
            for ev in c.get("timeline_events", []):
                visible_roles_str = json.dumps(ev.get("visible_roles", ["radiologist", "coordinator", "clinician"]))
                cursor.execute("""
                    INSERT OR REPLACE INTO timeline_events (
                        id, case_id, timestamp, event_type, subtype, specimen_id,
                        result_date, received_date, evidence_state, is_preliminary,
                        is_final, freshness_threshold_days, is_stale, title,
                        summary, full_report, report_id, visible_roles, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ev["id"],
                    case_id,
                    ev["timestamp"],
                    ev["event_type"],
                    ev["subtype"],
                    ev.get("specimen_id"),
                    ev["result_date"],
                    ev["received_date"],
                    ev["evidence_state"],
                    1 if ev["evidence_state"] == "preliminary" else 0,
                    1 if ev["evidence_state"] == "final" else 0,
                    ev["freshness_threshold_days"],
                    1 if ev["evidence_state"] == "stale" else 0,
                    ev["title"],
                    ev["summary"],
                    ev.get("full_report", ev["summary"]),
                    ev.get("report_id"),
                    visible_roles_str,
                    now_iso
                ))

            # Seed Specimens
            for sp in c.get("specimens", []):
                cursor.execute("""
                    INSERT OR REPLACE INTO specimens (
                        id, case_id, label, type, parent_id, status, collection_date, anatomic_site, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    sp["id"],
                    case_id,
                    sp["label"],
                    sp["type"],
                    sp.get("parent_id"),
                    sp["status"],
                    sp["collection_date"],
                    c["primary_dx"].split()[0],
                    "Archived in LIMS with barcode verification"
                ))

        # Seed Initial Audit Log Entries
        cursor.execute("""
            INSERT OR REPLACE INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "aud-init-01",
            "001",
            "usr-coord",
            "sarah.mdt@hospital.org",
            "coordinator",
            "CASE_ACCESS",
            "Case 001 accessed and automated timeline assembled.",
            "SUCCESS",
            "127.0.0.1",
            now_iso
        ))

        cursor.execute("""
            INSERT OR REPLACE INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "aud-init-02",
            "002",
            "usr-chair",
            "prof.adams@hospital.org",
            "chair",
            "CASE_ACCESS",
            "Case 002 opened for routine MDT pre-meeting review.",
            "SUCCESS",
            "127.0.0.1",
            now_iso
        ))

        # Seed Initial Notifications
        cursor.execute("""
            INSERT OR REPLACE INTO notifications (id, case_id, recipient_role, title, message, category, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "notif-001",
            "001",
            "coordinator",
            "STAT MDT Required",
            "Case 001 (PE Protocol) requires emergency MDT decision within 2 hours.",
            "urgent",
            0,
            now_iso
        ))

        cursor.execute("""
            INSERT OR REPLACE INTO notifications (id, case_id, recipient_role, title, message, category, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "notif-002",
            "003",
            "coordinator",
            "External Scan Overdue",
            "External CT for Case 003 delayed > 24 hours from GP transfer.",
            "delay",
            0,
            now_iso
        ))

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed()
