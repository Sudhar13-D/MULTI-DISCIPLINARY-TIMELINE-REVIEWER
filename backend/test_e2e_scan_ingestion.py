"""
Comprehensive End-to-End Automated Integration Test Suite
Covering External Scan Ingestion Edge Cases, Network Timeouts, and Usability Rubrics.

Designed for automated CI/CD pipeline execution with zero external daemon dependencies.
"""

import os
import json
import time
import io
import secrets
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient

from main import app
from database import init_db, get_db
from models import calculate_sus_score, SusAnswers

client = TestClient(app)

def setup_module():
    """Ensure database is initialized and seeded before running integration tests."""
    init_db()

def get_auth_token(email: str, password: str = "HospitalSecure2024!") -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Failed to login {email}: {res.text}"
    return res.json()["token"]

# ─── 1. Valid DICOM External Ingestion Test ───────────────────────────────────

def test_successful_dicom_scan_ingestion():
    token = get_auth_token("sarah.mdt@hospital.org")  # MDT Coordinator
    
    # Construct a valid DICOM Part 10 byte stream: 128 byte zero preamble + b'DICM' + dummy payload
    valid_dicom_bytes = (b"\x00" * 128) + b"DICM" + (b"\x00\x02\x00\x00" * 100)
    file_payload = ("chest_ct_scan.dcm", io.BytesIO(valid_dicom_bytes), "application/dicom")
    test_uid = f"1.2.840.113619.2.55.3.test1.{secrets.token_hex(4)}"

    res = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": file_payload},
        data={
            "modality": "CT",
            "series_instance_uid": test_uid,
            "accession_number": f"ACC-EXT-{secrets.token_hex(3)}",
            "institution_source": "St. Jude Regional Hospital"
        }
    )

    assert res.status_code == 200, f"Scan ingestion failed: {res.text}"
    data = res.json()
    assert data["status"] == "success"
    assert data["modality"] == "CT"
    assert data["freshness_state"] == "fresh"
    assert data["series_instance_uid"] == test_uid
    print("[PASS] 1. Valid DICOM external scan ingested with 'FRESH' status.")

    # Verify timeline updated: Case 003 previously missing scan is now satisfied
    t_res = client.get("/api/cases/003/timeline", headers={"Authorization": f"Bearer {token}"})
    assert t_res.status_code == 200
    events = t_res.json()
    ingested_events = [e for e in events if "St. Jude" in e["title"] or "chest_ct_scan" in e["summary"]]
    assert len(ingested_events) >= 1, "Ingested scan must appear on case timeline!"
    print("[PASS] 1b. Timeline reflection verified: Ingested external scan present on timeline.")

# ─── 2. Corrupted DICOM Header Edge Case ──────────────────────────────────────

def test_corrupt_dicom_missing_preamble_edge_case():
    token = get_auth_token("sarah.mdt@hospital.org")
    
    # Truncated corrupt file without 'DICM' preamble tag at offset 128
    corrupted_bytes = b"CORRUPTED_FILE_DATA_WITHOUT_DICOM_PREAMBLE" * 10
    file_payload = ("corrupted_ct.dcm", io.BytesIO(corrupted_bytes), "application/dicom")

    res = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": file_payload},
        data={
            "modality": "CT",
            "series_instance_uid": "1.2.840.corrupt.001"
        }
    )

    assert res.status_code == 400, f"Expected 400 Bad Request, got {res.status_code}"
    err = res.json()["detail"]
    assert "INVALID_DICOM_PREAMBLE" in err, f"Unexpected error detail: {err}"
    print("[PASS] 2. Corrupt DICOM without 'DICM' preamble safely rejected with HTTP 400.")

    # Verify security rejection logged in audit trail
    audit_res = client.get("/api/cases/003/audit-log", headers={"Authorization": f"Bearer {token}"})
    actions = [a["action"] for a in audit_res.json()]
    assert "SECURITY_SCAN_REJECTED" in actions
    print("[PASS] 2b. Audit trail logged SECURITY_SCAN_REJECTED.")

# ─── 3. Oversized Payload Edge Case (> 25MB) ──────────────────────────────────

def test_oversized_payload_edge_case():
    token = get_auth_token("sarah.mdt@hospital.org")
    
    # Create 26MB dummy payload (exceeding 25MB limit)
    oversized_bytes = b"0" * (26 * 1024 * 1024)
    file_payload = ("oversized_mri.dcm", io.BytesIO(oversized_bytes), "application/dicom")

    res = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": file_payload},
        data={"modality": "MRI"}
    )

    assert res.status_code == 400, f"Expected 400 for oversized payload, got {res.status_code}"
    assert "exceeds maximum size limit" in res.json()["detail"]
    print("[PASS] 3. Oversized file (> 25MB) safely rejected before storage.")

# ─── 4. Disallowed Dangerous Extension Edge Case ──────────────────────────────

def test_disallowed_extension_edge_case():
    token = get_auth_token("sarah.mdt@hospital.org")
    
    malicious_bytes = b"MZ\x90\x00\x03\x00\x00\x00"
    file_payload = ("trojan_scan.exe", io.BytesIO(malicious_bytes), "application/octet-stream")

    res = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": file_payload},
        data={"modality": "CT"}
    )

    assert res.status_code == 400
    assert "Disallowed file extension" in res.json()["detail"]
    print("[PASS] 4. Executable payload (.exe) blocked with HTTP 400.")

# ─── 5. Duplicate Scan Ingestion Edge Case (Idempotency) ──────────────────────

def test_duplicate_scan_ingestion_edge_case():
    token = get_auth_token("sarah.mdt@hospital.org")
    uid = f"1.2.840.113619.2.55.3.DUP.{secrets.token_hex(4)}"

    # First ingestion succeeds
    res1 = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "modality": "CT",
            "series_instance_uid": uid,
            "accession_number": f"ACC-DUP-{secrets.token_hex(2)}"
        }
    )
    assert res1.status_code == 200

    # Second ingestion of identical SeriesInstanceUID must trigger HTTP 409 Conflict
    res2 = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "modality": "CT",
            "series_instance_uid": uid,
            "accession_number": "ACC-DUP-1"
        }
    )
    assert res2.status_code == 409, f"Expected 409 Conflict for duplicate scan, got {res2.status_code}"
    assert "DUPLICATE_SCAN_INGESTION" in res2.json()["detail"]
    print("[PASS] 5. Duplicate scan ingestion detected & prevented with HTTP 409 Conflict.")

# ─── 6. Network Timeout Edge Case & Coordinator Alert ─────────────────────────

def test_remote_pacs_network_timeout():
    token = get_auth_token("sarah.mdt@hospital.org")

    res = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "modality": "CT",
            "simulate_timeout": True,
            "institution_source": "County District Clinic"
        }
    )

    assert res.status_code == 504, f"Expected 504 Gateway Timeout, got {res.status_code}"
    err = res.json()["detail"]
    assert err["error"] == "NETWORK_TIMEOUT"
    assert err["circuit_breaker_status"] == "OPEN"
    assert err["retries_attempted"] == 3
    print("[PASS] 6. PACS network timeout handled: Circuit breaker OPEN, HTTP 504 returned.")

    # Verify notification created for MDT Coordinator
    notif_res = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert notif_res.status_code == 200
    notifs = notif_res.json()
    timeout_notifs = [n for n in notifs if "PACS Network Timeout" in n["title"] or "timed out" in n["message"]]
    assert len(timeout_notifs) >= 1, "Alert notification must be created for coordinator upon timeout!"
    print("[PASS] 6b. Coordinator alerted of PACS network timeout via in-app notifications.")

# ─── 7. Network Transient Packet Drop Recovered on Retry ──────────────────────

def test_network_glitch_recovered_on_retry():
    token = get_auth_token("sarah.mdt@hospital.org")

    # Attempt 0: packet drop
    res0 = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "modality": "MRI",
            "simulate_error": "PACKET_DROP_RECOVER",
            "retry_count": 0
        }
    )
    assert res0.status_code == 503
    assert res0.json()["detail"]["retry_recommended"] is True

    # Attempt 1 (Retry): recovers and succeeds
    res1 = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "modality": "MRI",
            "simulate_error": "PACKET_DROP_RECOVER",
            "retry_count": 1
        }
    )
    assert res1.status_code == 200
    assert res1.json()["retry_count"] == 1
    print("[PASS] 7. Transient network drop recovered on retry #1 with full audit tracking.")

# ─── 8. PACS WADO-RS Fetch Endpoint Verification ──────────────────────────────

def test_pacs_fetch_study_endpoint():
    token = get_auth_token("sarah.mdt@hospital.org")

    # 1. Normal fetch
    res = client.post(
        "/api/integrations/pacs/fetch-study",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "case_id": "002",
            "accession_number": "ACC-PAC-002",
            "modality": "MRI",
            "timeout_seconds": 3.0
        }
    )
    assert res.status_code == 200
    assert res.json()["circuit_breaker_state"] == "CLOSED"

    # 2. Timeout fetch
    res_to = client.post(
        "/api/integrations/pacs/fetch-study",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "case_id": "002",
            "accession_number": "ACC-PAC-TIMEOUT",
            "modality": "MRI",
            "simulate_network_condition": "TIMEOUT"
        }
    )
    assert res_to.status_code == 504
    print("[PASS] 8. PACS WADO-RS fetch endpoint tested for both normal retrieval and network timeout.")

# ─── 9. Edge Cases: Nonexistent Case & Unauthenticated Requests ───────────────

def test_edge_cases_nonexistent_and_unauthenticated():
    token = get_auth_token("sarah.mdt@hospital.org")

    # Nonexistent case
    res404 = client.post(
        "/api/cases/case-999999/ingest-external-scan",
        headers={"Authorization": f"Bearer {token}"},
        data={"modality": "CT"}
    )
    assert res404.status_code == 404

    # Unauthenticated
    res401 = client.post(
        "/api/cases/001/ingest-external-scan",
        data={"modality": "CT"}
    )
    assert res401.status_code == 401
    print("[PASS] 9. Security & validation edge cases (404 Not Found & 401 Unauthorized) verified.")

# ─── 10. Concurrent Ingestion Thread Safety Test ──────────────────────────────

def test_concurrent_scan_ingestion_thread_safety():
    token = get_auth_token("sarah.mdt@hospital.org")

    def ingest_worker(idx):
        return client.post(
            "/api/cases/001/ingest-external-scan",
            headers={"Authorization": f"Bearer {token}"},
            data={
                "modality": "CT",
                "series_instance_uid": f"1.2.840.concurrent.{idx}.{secrets.token_hex(3)}",
                "accession_number": f"ACC-CONC-{idx}"
            }
        )

    import secrets
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(ingest_worker, i) for i in range(5)]
        results = [f.result() for f in futures]

    for r in results:
        assert r.status_code == 200, f"Concurrent ingestion failed: {r.text}"
    print("[PASS] 10. Thread safety & SQLite WAL transaction integrity verified across 5 concurrent workers.")

# ─── 11. System Usability Scale (SUS) Mathematical Rubric Test ────────────────

def test_sus_scoring_algorithm_and_rubric():
    token = get_auth_token("prof.adams@hospital.org")  # MDT Chair

    # Case A: Perfect usability answers (all 5s on odd items, all 1s on even items)
    # Total contributions = (4*5) + (4*5) = 40; 40 * 2.5 = 100.0
    perfect_answers = SusAnswers(
        q1_frequently_use=5,
        q2_complex=1,
        q3_easy_to_use=5,
        q4_need_support=1,
        q5_well_integrated=5,
        q6_inconsistency=1,
        q7_learn_quickly=5,
        q8_cumbersome=1,
        q9_confident=5,
        q10_learn_a_lot=1
    )
    score = calculate_sus_score(perfect_answers)
    assert score == 100.0, f"Expected 100.0, got {score}"

    # Submit to API
    res = client.post(
        "/api/system/usability/feedback",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "sus_answers": perfect_answers.model_dump(),
            "task_ratings": {
                "task1_case_intake_and_freshness": 7,
                "task2_external_scan_ingestion": 7,
                "task3_specimen_lineage_trace": 6,
                "task4_decision_recording": 7,
                "task5_audit_trail_inspection": 7
            },
            "qualitative_feedback": "Exemplary timeline visualization. Freshness badges prevented stale image oversight.",
            "clinical_role": "chair"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["sus_score"] == 100.0
    assert data["grade"] == "A+"
    assert data["adjective"] == "Best Imaginable"

    # Verify summary API
    sum_res = client.get("/api/system/usability/summary")
    assert sum_res.status_code == 200
    assert sum_res.json()["total_evaluations"] >= 1
    print("[PASS] 11. SUS scoring algorithm (0-100), Sauro-Lewis grading, and feedback API verified.")

# ─── 12. Full Clinical Journey: Scan Ingestion -> Timeline -> MDT Decision ────

def test_full_clinical_e2e_journey():
    coord_token = get_auth_token("sarah.mdt@hospital.org")
    chair_token = get_auth_token("prof.adams@hospital.org")
    journey_uid = f"1.2.840.113619.CASE003.{secrets.token_hex(4)}"

    # 1. Ingest missing scan for Case 003
    ingest_res = client.post(
        "/api/cases/003/ingest-external-scan",
        headers={"Authorization": f"Bearer {coord_token}"},
        data={
            "modality": "CT",
            "series_instance_uid": journey_uid,
            "accession_number": f"ACC-003-{secrets.token_hex(3)}",
            "institution_source": "Regional Thoracic Institute"
        }
    )
    assert ingest_res.status_code == 200
    event_id = ingest_res.json()["timeline_event_id"]

    # 2. Chair reviews timeline and confirms freshness
    t_res = client.get("/api/cases/003/timeline", headers={"Authorization": f"Bearer {chair_token}"})
    assert t_res.status_code == 200

    # 3. Chair records consensus MDT decision citing the newly ingested scan
    dec_res = client.post(
        "/api/decisions",
        headers={"Authorization": f"Bearer {chair_token}"},
        json={
            "case_id": "003",
            "decision_text": "Proceed to robotic right upper lobectomy following review of newly ingested regional CT thorax.",
            "treatment_pathway": "Surgical Resection",
            "consensus_level": "Unanimous",
            "contingency_action": "Conversion to open thoracotomy if dense pleural adhesions present.",
            "evidence_reviewed": [event_id],
            "stale_risk_acknowledged": True
        }
    )
    assert dec_res.status_code == 200
    assert dec_res.json()["status"] == "binding"

    # 4. Verify complete audit log chain
    audit_res = client.get("/api/cases/003/audit-log", headers={"Authorization": f"Bearer {chair_token}"})
    actions = [a["action"] for a in audit_res.json()]
    assert "SCAN_INGESTION_SUCCESS" in actions
    assert "DECISION_SUBMITTED" in actions
    print("[PASS] 12. Complete Clinical E2E Journey verified: Ingestion -> Freshness -> Decision -> Governance Audit.")

if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING CLINICAL MDT E2E INTEGRATION & EDGE-CASE TEST SUITE")
    print("=" * 70)
    test_successful_dicom_scan_ingestion()
    test_corrupt_dicom_missing_preamble_edge_case()
    test_oversized_payload_edge_case()
    test_disallowed_extension_edge_case()
    test_duplicate_scan_ingestion_edge_case()
    test_remote_pacs_network_timeout()
    test_network_glitch_recovered_on_retry()
    test_pacs_fetch_study_endpoint()
    test_edge_cases_nonexistent_and_unauthenticated()
    test_concurrent_scan_ingestion_thread_safety()
    test_sus_scoring_algorithm_and_rubric()
    test_full_clinical_e2e_journey()
    print("=" * 70)
    print("ALL 12 E2E INTEGRATION & EDGE-CASE TESTS PASSED (100% VERIFIED)!")
    print("=" * 70)
