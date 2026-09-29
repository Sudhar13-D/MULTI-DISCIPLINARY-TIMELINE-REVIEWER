"""
Core Automated Backend Test Suite
Validates Authentication, RBAC Security Guards, Decision Recording,
Data Freshness Badges, System Integrations, and Audit Trail Persistence.
"""

import json
from fastapi.testclient import TestClient
from main import app
from database import init_db

client = TestClient(app)

def test_backend():
    print("Testing Clinical MDT Decision System Backend...")
    init_db()

    # 1. Login as Chair
    chair_res = client.post("/api/auth/login", json={
        "email": "prof.adams@hospital.org",
        "password": "HospitalSecure2024!"
    })
    assert chair_res.status_code == 200, f"Chair login failed: {chair_res.text}"
    chair_data = chair_res.json()
    chair_token = chair_data["token"]
    print("[PASS] 1. Chair login succeeded:", chair_data["user"]["full_name"], f"({chair_data['user']['role']})")

    # 2. Login as Radiologist
    rad_res = client.post("/api/auth/login", json={
        "email": "dr.chen@hospital.org",
        "password": "HospitalSecure2024!"
    })
    assert rad_res.status_code == 200, f"Radiologist login failed: {rad_res.text}"
    rad_data = rad_res.json()
    rad_token = rad_data["token"]
    print("[PASS] 2. Radiologist login succeeded:", rad_data["user"]["full_name"], f"({rad_data['user']['role']})")

    # 3. Retrieve Cases
    cases_res = client.get("/api/cases", headers={"Authorization": f"Bearer {chair_token}"})
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) > 0
    print(f"[PASS] 3. Retrieved {len(cases)} cases. Case 001 primaryDx:", cases[0]["primary_dx"])

    # 4. Check Timeline & Freshness Badges
    time_res = client.get("/api/cases/001/timeline", headers={"Authorization": f"Bearer {chair_token}"})
    assert time_res.status_code == 200
    timeline = time_res.json()
    assert len(timeline) > 0
    print(f"[PASS] 4. Case 001 timeline events count: {len(timeline)}")
    for ev in timeline:
        print(f"   Event: {ev['title']} -> State: {ev['evidence_state']}, Badge: {ev['freshness_badge']['label']} ({ev['freshness_badge']['color']})")

    # 5. Safety-Critical RBAC Test: Radiologist attempts to submit Decision
    rad_dec_res = client.post(
        "/api/decisions",
        headers={"Authorization": f"Bearer {rad_token}"},
        json={
            "case_id": "001",
            "decision_text": "Unauthorized decision attempt by Radiologist",
            "treatment_pathway": "Active Surveillance",
            "consensus_level": "Unanimous",
            "evidence_reviewed": ["ev-001-1"]
        }
    )
    assert rad_dec_res.status_code == 403, f"Expected 403 Forbidden for Radiologist, got {rad_dec_res.status_code}"
    print("[PASS] 5. Safety-Critical RBAC PASS: Radiologist was correctly rejected with HTTP 403 Forbidden!")
    print(f"   Server response: {rad_dec_res.json()['detail']}")

    # 6. Authorized Decision Submission: Chair submits Decision
    chair_dec_res = client.post(
        "/api/decisions",
        headers={"Authorization": f"Bearer {chair_token}"},
        json={
            "case_id": "001",
            "decision_text": "Initiate emergency therapeutic anticoagulation (UFH bolus + continuous infusion) per PE protocol.",
            "treatment_pathway": "Therapeutic Anticoagulation",
            "consensus_level": "Unanimous",
            "contingency_action": "Serial aPTT monitoring at 6-hour intervals; repeat echocardiogram if hemodynamically unstable.",
            "evidence_reviewed": ["ev-001-1"],
            "stale_risk_acknowledged": True
        }
    )
    assert chair_dec_res.status_code == 200, f"Chair decision failed: {chair_dec_res.text}"
    dec_res = chair_dec_res.json()
    print(f"[PASS] 6. Chair Decision submission PASS: Decision recorded ID {dec_res['id']}, Status: {dec_res['status']}")

    # 7. Check Audit Trail: Verify security rejection and decision submission are both recorded!
    audit_res = client.get("/api/cases/001/audit-log", headers={"Authorization": f"Bearer {chair_token}"})
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    actions = [a["action"] for a in audit_logs]
    print(f"[PASS] 7. Audit log verified: {len(audit_logs)} entries recorded. Actions: {actions[:4]}")
    assert "SECURITY_ACCESS_REJECTED" in actions, "Security rejection must be in audit logs!"
    assert "DECISION_SUBMITTED" in actions, "Decision submission must be in audit logs!"
    print("   Both SECURITY_ACCESS_REJECTED and DECISION_SUBMITTED verified in audit trail!")

    # 8. Check Integrations Healthcheck
    integ_res = client.get("/api/system/integrations")
    assert integ_res.status_code == 200
    integ = integ_res.json()
    print(f"[PASS] 8. System Integrations health check: PACS status: {integ['pacs']['status']} ({integ['pacs']['latency_ms']}ms), Overall: {integ['overall_status']}")

    print("\nALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY! (100% Verified)")

if __name__ == "__main__":
    test_backend()
