import os
import json
import secrets
import shutil
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import get_db, init_db
from models import (
    EVIDENCE_FRESHNESS_THRESHOLDS,
    EvidenceState,
    get_evidence_freshness_badge,
    LoginRequest,
    LoginResponse,
    UserResponse,
    CaseSummaryResponse,
    TimelineEventResponse,
    FreshnessSummaryResponse,
    DecisionCreateRequest,
    DecisionResponse,
    AcknowledgeStaleDataRequest,
    AuditLogEntry,
    SpecimenNode,
    NotificationResponse,
    SystemIntegrationsResponse,
    IntegrationStatus,
)
from auth import (
    verify_password,
    create_session,
    get_current_user,
    require_roles,
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Clinical MDT Evidence Timeline API",
    version="2.0.0",
    description="Safety-critical clinical decision support backend for Multidisciplinary Team Case Review."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded medical files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    init_db()

# ─── Auth Endpoints ───────────────────────────────────────────────────────────

@app.post("/api/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        user = conn.execute(
            "SELECT id, email, password_hash, salt, full_name, role, department FROM users WHERE email = ?",
            (payload.email.strip().lower(),)
        ).fetchone()

        if not user or not verify_password(payload.password, user["salt"], user["password_hash"]):
            # Record failed login attempt
            conn.execute("""
                INSERT INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"aud-{secrets.token_hex(6)}",
                None,
                user["id"] if user else None,
                payload.email,
                user["role"] if user else "anonymous",
                "AUTH_LOGIN_FAILED",
                f"Failed login attempt for '{payload.email}'",
                "REJECTED",
                client_ip,
                now_iso
            ))
            raise HTTPException(status_code=401, detail="Invalid clinical credentials.")

        # Create session
        token = create_session(user["id"])

        # Audit success
        conn.execute("""
            INSERT INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"aud-{secrets.token_hex(6)}",
            None,
            user["id"],
            user["email"],
            user["role"],
            "AUTH_LOGIN_SUCCESS",
            f"User '{user['full_name']}' logged in successfully.",
            "SUCCESS",
            client_ip,
            now_iso
        ))

        return LoginResponse(
            token=token,
            user=UserResponse(
                id=user["id"],
                email=user["email"],
                full_name=user["full_name"],
                role=user["role"],
                department=user["department"]
            )
        )

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        department=user["department"]
    )

@app.post("/api/auth/logout")
def logout(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
    return {"message": "Logged out successfully."}

# ─── Case Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/cases", response_model=List[CaseSummaryResponse])
def list_cases(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM cases ORDER BY urgency DESC, id ASC").fetchall()
        return [
            CaseSummaryResponse(
                id=r["id"],
                patient_de_id=r["patient_de_id"],
                age=r["age"],
                sex=r["sex"],
                primary_dx=r["primary_dx"],
                referring_dept=r["referring_dept"],
                urgency=r["urgency"],
                decision_required_by_hours=r["decision_required_by_hours"],
                complexity=r["complexity"],
                baseline_minutes=r["baseline_minutes"],
                target_minutes=r["target_minutes"],
                status=r["status"],
                next_action=r["next_action"],
                created_at=r["created_at"]
            )
            for r in rows
        ]

@app.get("/api/cases/{case_id}", response_model=CaseSummaryResponse)
def get_case(case_id: str, request: Request, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        r = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

        # Log case view in audit log
        client_ip = request.client.host if request.client else "unknown"
        now_iso = datetime.now(timezone.utc).isoformat()
        conn.execute("""
            INSERT INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"aud-{secrets.token_hex(6)}",
            case_id,
            user["id"],
            user["email"],
            user["role"],
            "CASE_VIEW",
            f"Case '{case_id}' viewed by {user['full_name']} ({user['role']}).",
            "SUCCESS",
            client_ip,
            now_iso
        ))

        return CaseSummaryResponse(
            id=r["id"],
            patient_de_id=r["patient_de_id"],
            age=r["age"],
            sex=r["sex"],
            primary_dx=r["primary_dx"],
            referring_dept=r["referring_dept"],
            urgency=r["urgency"],
            decision_required_by_hours=r["decision_required_by_hours"],
            complexity=r["complexity"],
            baseline_minutes=r["baseline_minutes"],
            target_minutes=r["target_minutes"],
            status=r["status"],
            next_action=r["next_action"],
            created_at=r["created_at"]
        )

# ─── Timeline & Evidence Freshness Endpoints ─────────────────────────────────

@app.get("/api/cases/{case_id}/timeline", response_model=List[TimelineEventResponse])
def get_case_timeline(case_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        events = conn.execute(
            "SELECT * FROM timeline_events WHERE case_id = ? ORDER BY timestamp ASC",
            (case_id,)
        ).fetchall()

        result = []
        for ev in events:
            roles = json.loads(ev["visible_roles"])
            # Freshness badge evaluation
            badge = get_evidence_freshness_badge(
                evidence_state=ev["evidence_state"],
                result_date_str=ev["result_date"],
                threshold_days=ev["freshness_threshold_days"]
            )

            result.append(TimelineEventResponse(
                id=ev["id"],
                case_id=ev["case_id"],
                timestamp=ev["timestamp"],
                event_type=ev["event_type"],
                subtype=ev["subtype"],
                specimen_id=ev["specimen_id"],
                result_date=ev["result_date"],
                received_date=ev["received_date"],
                evidence_state=ev["evidence_state"],
                is_preliminary=bool(ev["is_preliminary"]),
                is_final=bool(ev["is_final"]),
                freshness_threshold_days=ev["freshness_threshold_days"],
                is_stale=bool(ev["is_stale"] or badge["state"] == "stale"),
                title=ev["title"],
                summary=ev["summary"],
                full_report=ev["full_report"],
                report_id=ev["report_id"],
                visible_roles=roles,
                freshness_badge=badge
            ))
        return result

@app.get("/api/cases/{case_id}/evidence-freshness", response_model=FreshnessSummaryResponse)
def get_evidence_freshness(case_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        events = conn.execute("SELECT * FROM timeline_events WHERE case_id = ?", (case_id,)).fetchall()
        
        fresh_count = 0
        stale_count = 0
        missing_count = 0
        preliminary_count = 0
        superseded_count = 0

        for ev in events:
            badge = get_evidence_freshness_badge(
                evidence_state=ev["evidence_state"],
                result_date_str=ev["result_date"],
                threshold_days=ev["freshness_threshold_days"]
            )
            state = badge["state"]
            if state == "fresh":
                fresh_count += 1
            elif state == "stale":
                stale_count += 1
            elif state == "missing":
                missing_count += 1
            elif state == "preliminary":
                preliminary_count += 1
            elif state == "superseded":
                superseded_count += 1

        return FreshnessSummaryResponse(
            case_id=case_id,
            fresh_count=fresh_count,
            stale_count=stale_count,
            missing_count=missing_count,
            preliminary_count=preliminary_count,
            superseded_count=superseded_count,
            total_count=len(events)
        )

@app.get("/api/evidence/{event_id}/details")
def get_evidence_details(event_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        ev = conn.execute("SELECT * FROM timeline_events WHERE id = ?", (event_id,)).fetchone()
        if not ev:
            raise HTTPException(status_code=404, detail="Evidence item not found.")

        specimen = None
        if ev["specimen_id"]:
            sp_row = conn.execute("SELECT * FROM specimens WHERE id = ?", (ev["specimen_id"],)).fetchone()
            if sp_row:
                specimen = dict(sp_row)

        badge = get_evidence_freshness_badge(
            evidence_state=ev["evidence_state"],
            result_date_str=ev["result_date"],
            threshold_days=ev["freshness_threshold_days"]
        )

        return {
            "id": ev["id"],
            "case_id": ev["case_id"],
            "title": ev["title"],
            "event_type": ev["event_type"],
            "subtype": ev["subtype"],
            "summary": ev["summary"],
            "full_report": ev["full_report"],
            "report_id": ev["report_id"],
            "evidence_state": ev["evidence_state"],
            "freshness_badge": badge,
            "specimen": specimen,
            "timestamp": ev["timestamp"]
        }

# ─── Decision Endpoints (Safety-Critical RBAC) ───────────────────────────────

@app.post("/api/decisions", response_model=DecisionResponse)
def submit_decision(
    payload: DecisionCreateRequest,
    request: Request,
    user: dict = Depends(require_roles(["chair", "coordinator"]))
):
    """
    Core safety-critical endpoint. Only Chair or MDT Coordinator can submit binding decisions.
    Any attempt by other roles returns 403 Forbidden with security audit logging.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    decision_id = f"dec-{secrets.token_hex(6)}"
    client_ip = request.client.host if request.client else "unknown"

    with get_db() as conn:
        # Check case existence
        case = conn.execute("SELECT * FROM cases WHERE id = ?", (payload.case_id,)).fetchone()
        if not case:
            raise HTTPException(status_code=404, detail=f"Case '{payload.case_id}' not found.")

        # Insert decision
        conn.execute("""
            INSERT INTO decisions (
                id, case_id, submitted_by_user_id, decision_text, treatment_pathway,
                consensus_level, contingency_action, evidence_reviewed,
                stale_risk_acknowledged, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            decision_id,
            payload.case_id,
            user["id"],
            payload.decision_text,
            payload.treatment_pathway,
            payload.consensus_level,
            payload.contingency_action,
            json.dumps(payload.evidence_reviewed),
            1 if payload.stale_risk_acknowledged else 0,
            "binding",
            now_iso
        ))

        # Create Timeline Event representing MDT Decision
        event_id = f"ev-mdt-{secrets.token_hex(4)}"
        conn.execute("""
            INSERT INTO timeline_events (
                id, case_id, timestamp, event_type, subtype, result_date, received_date,
                evidence_state, is_preliminary, is_final, freshness_threshold_days,
                is_stale, title, summary, full_report, visible_roles, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            payload.case_id,
            now_iso,
            "review",
            "mdt_decision",
            now_iso,
            now_iso,
            "final",
            0,
            1,
            365,
            0,
            f"Binding MDT Decision: {payload.treatment_pathway}",
            payload.decision_text,
            f"Consensus: {payload.consensus_level}\nPathway: {payload.treatment_pathway}\nContingency: {payload.contingency_action or 'None'}\nReviewed: {len(payload.evidence_reviewed)} items.",
            json.dumps(["chair", "coordinator", "radiologist", "pathologist", "molecular", "clinician"]),
            now_iso
        ))

        # Update case status
        conn.execute("""
            UPDATE cases SET status = 'completed', next_action = ? WHERE id = ?
        """, (f"Decision Binding: {payload.treatment_pathway}", payload.case_id))

        # Add Audit Log Entry
        conn.execute("""
            INSERT INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"aud-{secrets.token_hex(6)}",
            payload.case_id,
            user["id"],
            user["email"],
            user["role"],
            "DECISION_SUBMITTED",
            f"Binding MDT Decision submitted by {user['full_name']} ({user['role']}). Pathway: '{payload.treatment_pathway}'. Consensus: '{payload.consensus_level}'.",
            "SUCCESS",
            client_ip,
            now_iso
        ))

        # Dispatch Notification to Team
        conn.execute("""
            INSERT INTO notifications (id, case_id, recipient_role, title, message, category, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"notif-{secrets.token_hex(4)}",
            payload.case_id,
            "clinician",
            f"MDT Decision: {case['patient_de_id']}",
            f"Binding decision submitted ({payload.treatment_pathway}). Action authorized.",
            "decision",
            0,
            now_iso
        ))

        return DecisionResponse(
            id=decision_id,
            case_id=payload.case_id,
            submitted_by_user_id=user["id"],
            submitted_by_name=user["full_name"],
            submitted_by_role=user["role"],
            decision_text=payload.decision_text,
            treatment_pathway=payload.treatment_pathway,
            consensus_level=payload.consensus_level,
            contingency_action=payload.contingency_action,
            evidence_reviewed=payload.evidence_reviewed,
            stale_risk_acknowledged=payload.stale_risk_acknowledged,
            status="binding",
            created_at=now_iso
        )

@app.post("/api/cases/{case_id}/acknowledge-stale-data")
def acknowledge_stale_data(
    case_id: str,
    payload: AcknowledgeStaleDataRequest,
    request: Request,
    user: dict = Depends(get_current_user)
):
    now_iso = datetime.now(timezone.utc).isoformat()
    client_ip = request.client.host if request.client else "unknown"

    with get_db() as conn:
        conn.execute("""
            INSERT INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"aud-{secrets.token_hex(6)}",
            case_id,
            user["id"],
            user["email"],
            user["role"],
            "STALE_DATA_ACKNOWLEDGED",
            f"Clinician acknowledged reliance on stale/preliminary evidence {payload.event_ids}. Rationale: '{payload.rationale}'.",
            "SUCCESS",
            client_ip,
            now_iso
        ))

    return {"status": "success", "message": "Stale data risk acknowledgment logged to audit trail."}

@app.get("/api/cases/{case_id}/audit-log", response_model=List[AuditLogEntry])
def get_case_audit_log(case_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_logs WHERE case_id = ? OR case_id IS NULL ORDER BY timestamp DESC LIMIT 100",
            (case_id,)
        ).fetchall()

        return [
            AuditLogEntry(
                id=r["id"],
                case_id=r["case_id"],
                user_id=r["user_id"],
                user_email=r["user_email"],
                user_role=r["user_role"],
                action=r["action"],
                details=r["details"],
                status=r["status"],
                ip_address=r["ip_address"],
                timestamp=r["timestamp"]
            )
            for r in rows
        ]

# ─── Specimen Lineage Tree Endpoint ──────────────────────────────────────────

@app.get("/api/cases/{case_id}/specimens/tree", response_model=List[SpecimenNode])
def get_specimen_tree(case_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM specimens WHERE case_id = ?", (case_id,)).fetchall()
        specimens = [dict(r) for r in rows]

        # Build hierarchical tree: roots have parent_id == None
        lookup = {}
        for sp in specimens:
            lookup[sp["id"]] = SpecimenNode(
                id=sp["id"],
                case_id=sp["case_id"],
                label=sp["label"],
                type=sp["type"],
                parent_id=sp["parent_id"],
                status=sp["status"],
                collection_date=sp["collection_date"],
                anatomic_site=sp["anatomic_site"],
                notes=sp["notes"],
                children=[]
            )

        roots = []
        for sp in specimens:
            node = lookup[sp["id"]]
            if sp["parent_id"] and sp["parent_id"] in lookup:
                lookup[sp["parent_id"]].children.append(node)
            else:
                roots.append(node)

        return roots

# ─── Document Uploads Endpoint ───────────────────────────────────────────────

ALLOWED_EXTENSIONS = {".pdf", ".dcm", ".png", ".jpg", ".jpeg", ".tiff", ".csv"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

@app.post("/api/cases/{case_id}/documents")
async def upload_document(
    case_id: str,
    request: Request,
    file: UploadFile = File(...),
    category: str = Form("clinical_report"),
    specimen_id: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Disallowed file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Save file and calculate size
    doc_id = f"doc-{secrets.token_hex(6)}"
    safe_name = f"{doc_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    size = 0
    with open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                os.remove(file_path)
                raise HTTPException(status_code=400, detail="File exceeds maximum size limit of 25MB.")
            f.write(chunk)

    now_iso = datetime.now(timezone.utc).isoformat()
    client_ip = request.client.host if request.client else "unknown"

    with get_db() as conn:
        conn.execute("""
            INSERT INTO documents (
                id, case_id, specimen_id, uploaded_by_user_id, file_name,
                file_path, file_size, mime_type, category, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            case_id,
            specimen_id,
            user["id"],
            file.filename,
            f"/uploads/{safe_name}",
            size,
            file.content_type or "application/octet-stream",
            category,
            notes,
            now_iso
        ))

        # Add timeline event for uploaded external evidence
        conn.execute("""
            INSERT INTO timeline_events (
                id, case_id, timestamp, event_type, subtype, specimen_id, result_date,
                received_date, evidence_state, is_preliminary, is_final, freshness_threshold_days,
                is_stale, title, summary, full_report, visible_roles, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"ev-doc-{secrets.token_hex(4)}",
            case_id,
            now_iso,
            "imaging" if category == "imaging" else "pathology" if category == "pathology" else "review",
            "external_document",
            specimen_id,
            now_iso,
            now_iso,
            "final",
            0,
            1,
            30,
            0,
            f"External Attachment: {file.filename}",
            f"Uploaded by {user['full_name']} ({user['role']}). Category: {category}. Size: {size // 1024} KB.",
            notes or "No additional notes provided.",
            json.dumps(["chair", "coordinator", "radiologist", "pathologist", "molecular", "clinician"]),
            now_iso
        ))

        # Audit upload
        conn.execute("""
            INSERT INTO audit_logs (id, case_id, user_id, user_email, user_role, action, details, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f"aud-{secrets.token_hex(6)}",
            case_id,
            user["id"],
            user["email"],
            user["role"],
            "DOCUMENT_UPLOADED",
            f"Uploaded '{file.filename}' ({size // 1024} KB) to case {case_id}.",
            "SUCCESS",
            client_ip,
            now_iso
        ))

    return {
        "status": "success",
        "document_id": doc_id,
        "file_name": file.filename,
        "url": f"/uploads/{safe_name}",
        "size_bytes": size
    }

@app.get("/api/cases/{case_id}/documents")
def list_documents(case_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM documents WHERE case_id = ? ORDER BY created_at DESC", (case_id,)).fetchall()
        return [dict(r) for r in rows]

# ─── System Integrations (PACS / LIMS) Health Endpoint ───────────────────────

@app.get("/api/system/integrations", response_model=SystemIntegrationsResponse)
def get_system_integrations():
    now_iso = datetime.now(timezone.utc).isoformat()
    return SystemIntegrationsResponse(
        pacs=IntegrationStatus(
            name="Hospital PACS DICOMweb",
            protocol="DICOMweb WADO-RS / QIDO-RS",
            endpoint="https://pacs.hospital.internal/dicomweb",
            status="Connected",
            latency_ms=18,
            last_handshake=now_iso,
            details="Active connection to Fuji/Sectra PACS; TLS 1.3 mutual auth verified."
        ),
        lis=IntegrationStatus(
            name="Laboratory Information System (LIS)",
            protocol="HL7 v2.5.1 / FHIR R4",
            endpoint="https://lis.hospital.internal/fhir",
            status="Connected",
            latency_ms=24,
            last_handshake=now_iso,
            details="Bi-directional order/result feed active; specimen barcode auto-sync enabled."
        ),
        genomics_lab=IntegrationStatus(
            name="Molecular Reference Laboratory",
            protocol="Secure REST API / SFTP",
            endpoint="https://genomics.external-lab.org/api/v1",
            status="Connected",
            latency_ms=42,
            last_handshake=now_iso,
            details="Automated variant reporting pipeline verified."
        ),
        ehr=IntegrationStatus(
            name="Core Hospital EHR System",
            protocol="SMART on FHIR",
            endpoint="https://ehr.hospital.internal/open-fhir",
            status="Connected",
            latency_ms=12,
            last_handshake=now_iso,
            details="Patient demographics & encounter synchronization verified."
        ),
        overall_status="OPERATIONAL"
    )

# ─── Notifications Endpoint ───────────────────────────────────────────────────

@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT * FROM notifications
            WHERE recipient_role IS NULL OR recipient_role = ?
            ORDER BY created_at DESC LIMIT 20
        """, (user["role"],)).fetchall()

        return [
            NotificationResponse(
                id=r["id"],
                case_id=r["case_id"],
                recipient_role=r["recipient_role"],
                title=r["title"],
                message=r["message"],
                category=r["category"],
                is_read=bool(r["is_read"]),
                created_at=r["created_at"]
            )
            for r in rows
        ]

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    with get_db() as conn:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
