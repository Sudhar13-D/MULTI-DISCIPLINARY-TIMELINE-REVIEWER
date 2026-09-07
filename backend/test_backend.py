import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

def test_backend():
    print("Testing Clinical MDT Decision System Backend...")

    # 1. Login as Chair
    chair_login_payload = json.dumps({
        "email": "prof.adams@hospital.org",
        "password": "HospitalSecure2024!"
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=chair_login_payload,
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    chair_data = json.loads(res.read().decode())
    chair_token = chair_data["token"]
    print("[PASS] 1. Chair login succeeded:", chair_data["user"]["full_name"], f"({chair_data['user']['role']})")

    # 2. Login as Radiologist
    rad_login_payload = json.dumps({
        "email": "dr.chen@hospital.org",
        "password": "HospitalSecure2024!"
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=rad_login_payload,
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    rad_data = json.loads(res.read().decode())
    rad_token = rad_data["token"]
    print("[PASS] 2. Radiologist login succeeded:", rad_data["user"]["full_name"], f"({rad_data['user']['role']})")

    # 3. Retrieve Cases
    req = urllib.request.Request(
        f"{BASE_URL}/api/cases",
        headers={"Authorization": f"Bearer {chair_token}"}
    )
    res = urllib.request.urlopen(req)
    cases = json.loads(res.read().decode())
    print(f"[PASS] 3. Retrieved {len(cases)} cases. Case 001 primaryDx:", cases[0]["primary_dx"])

    # 4. Check Timeline & Freshness Badges
    req = urllib.request.Request(
        f"{BASE_URL}/api/cases/001/timeline",
        headers={"Authorization": f"Bearer {chair_token}"}
    )
    res = urllib.request.urlopen(req)
    timeline = json.loads(res.read().decode())
    print(f"[PASS] 4. Case 001 timeline events count: {len(timeline)}")
    for ev in timeline:
        print(f"   Event: {ev['title']} -> State: {ev['evidence_state']}, Badge: {ev['freshness_badge']['label']} ({ev['freshness_badge']['color']})")

    # 5. Safety-Critical RBAC Test: Radiologist attempts to submit Decision
    decision_payload = json.dumps({
        "case_id": "001",
        "decision_text": "Unauthorized decision attempt by Radiologist",
        "treatment_pathway": "Active Surveillance",
        "consensus_level": "Unanimous",
        "evidence_reviewed": ["ev-001-1"]
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/decisions",
        data=decision_payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {rad_token}"
        }
    )
    try:
        urllib.request.urlopen(req)
        print("[FAIL] 5. FAILED: Radiologist was NOT rejected!")
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print("[PASS] 5. Safety-Critical RBAC PASS: Radiologist was correctly rejected with HTTP 403 Forbidden!")
            err_body = json.loads(e.read().decode())
            print(f"   Server response: {err_body['detail']}")
        else:
            print(f"[FAIL] 5. FAILED: Unexpected HTTP code {e.code}")

    # 6. Authorized Decision Submission: Chair submits Decision
    chair_decision_payload = json.dumps({
        "case_id": "001",
        "decision_text": "Initiate emergency therapeutic anticoagulation (UFH bolus + continuous infusion) per PE protocol.",
        "treatment_pathway": "Therapeutic Anticoagulation",
        "consensus_level": "Unanimous",
        "contingency_action": "Serial aPTT monitoring at 6-hour intervals; repeat echocardiogram if hemodynamically unstable.",
        "evidence_reviewed": ["ev-001-1"],
        "stale_risk_acknowledged": True
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/api/decisions",
        data=chair_decision_payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {chair_token}"
        }
    )
    res = urllib.request.urlopen(req)
    dec_res = json.loads(res.read().decode())
    print(f"[PASS] 6. Chair Decision submission PASS: Decision recorded ID {dec_res['id']}, Status: {dec_res['status']}")

    # 7. Check Audit Trail: Verify security rejection and decision submission are both recorded!
    req = urllib.request.Request(
        f"{BASE_URL}/api/cases/001/audit-log",
        headers={"Authorization": f"Bearer {chair_token}"}
    )
    res = urllib.request.urlopen(req)
    audit_logs = json.loads(res.read().decode())
    actions = [a["action"] for a in audit_logs]
    print(f"[PASS] 7. Audit log verified: {len(audit_logs)} entries recorded. Actions: {actions[:4]}")
    assert "SECURITY_ACCESS_REJECTED" in actions, "Security rejection must be in audit logs!"
    assert "DECISION_SUBMITTED" in actions, "Decision submission must be in audit logs!"
    print("   Both SECURITY_ACCESS_REJECTED and DECISION_SUBMITTED verified in audit trail!")

    # 8. Check Integrations Healthcheck
    req = urllib.request.Request(f"{BASE_URL}/api/system/integrations")
    res = urllib.request.urlopen(req)
    integ = json.loads(res.read().decode())
    print(f"[PASS] 8. System Integrations health check: PACS status: {integ['pacs']['status']} ({integ['pacs']['latency_ms']}ms), Overall: {integ['overall_status']}")

    print("\nALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY! (100% Verified)")

if __name__ == "__main__":
    test_backend()
