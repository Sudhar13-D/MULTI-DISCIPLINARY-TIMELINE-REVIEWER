from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

# ─── Evidence Freshness Thresholds (in Days) ──────────────────────────────────
EVIDENCE_FRESHNESS_THRESHOLDS: Dict[str, Dict[str, int]] = {
    "imaging_ct": {"fresh_until": 7, "stale_after": 30},
    "imaging_mri": {"fresh_until": 14, "stale_after": 60},
    "imaging_ultrasound": {"fresh_until": 3, "stale_after": 14},
    "imaging_xray": {"fresh_until": 2, "stale_after": 7},
    "pathology_biopsy": {"fresh_until": 30, "stale_after": 90},
    "pathology_surgical": {"fresh_until": 7, "stale_after": 21},
    "molecular_ngs": {"fresh_until": 14, "stale_after": 60},
    "molecular_pcr": {"fresh_until": 7, "stale_after": 21},
    "clinical_labs": {"fresh_until": 1, "stale_after": 3},
}

# ─── Evidence State Machine ───────────────────────────────────────────────────
class EvidenceState(str, Enum):
    ORDERED = "ordered"
    RECEIVED = "received"
    PRELIMINARY = "preliminary"
    FINAL = "final"
    STALE = "stale"
    MISSING = "missing"
    UNAVAILABLE = "unavailable"
    SUPERSEDED = "superseded"

class UserRole(str, Enum):
    CHAIR = "chair"
    COORDINATOR = "coordinator"
    RADIOLOGIST = "radiologist"
    PATHOLOGIST = "pathologist"
    MOLECULAR = "molecular"
    CLINICIAN = "clinician"

def get_evidence_freshness_badge(
    evidence_state: str,
    result_date_str: str,
    threshold_days: int
) -> Dict[str, Any]:
    """
    Returns standardized freshness badge metadata for UI rendering.
    """
    if evidence_state == "missing":
        return {
            "state": "missing",
            "icon": "✗",
            "color": "red",
            "label": "MISSING",
            "tooltip": "Expected clinical evidence not yet received",
            "age_days": None
        }

    if evidence_state == "superseded":
        return {
            "state": "superseded",
            "icon": "✗",
            "color": "gray",
            "label": "SUPERSEDED",
            "tooltip": "Older assay superseded by subsequent validated run",
            "age_days": None
        }

    try:
        # Parse ISO date string
        clean_date_str = result_date_str.replace("Z", "+00:00")
        res_date = datetime.fromisoformat(clean_date_str)
        if res_date.tzinfo is None:
            res_date = res_date.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        age = max(0, (now - res_date).days)
    except Exception:
        age = 0

    if evidence_state == "preliminary":
        return {
            "state": "preliminary",
            "icon": "⚠",
            "color": "orange",
            "label": "PRELIMINARY",
            "tooltip": f"Preliminary report ({age}d old) — pending consultant verification",
            "age_days": age
        }

    if evidence_state in ["final", "received", "stale"]:
        if age <= threshold_days and evidence_state != "stale":
            return {
                "state": "fresh",
                "icon": "✓",
                "color": "green",
                "label": "FRESH",
                "tooltip": f"Fresh evidence ({age}d old; threshold {threshold_days}d)",
                "age_days": age
            }
        else:
            return {
                "state": "stale",
                "icon": "⚠⚠",
                "color": "red",
                "label": "STALE",
                "tooltip": f"Stale evidence ({age}d old; threshold {threshold_days}d) — repeat study advised",
                "age_days": age
            }

    return {
        "state": "unknown",
        "icon": "?",
        "color": "gray",
        "label": "UNKNOWN",
        "tooltip": "Unspecified evidence state",
        "age_days": age
    }

# ─── Pydantic Request & Response Schemas ──────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class CaseSummaryResponse(BaseModel):
    id: str
    patient_de_id: str
    age: int
    sex: str
    primary_dx: str
    referring_dept: str
    urgency: str
    decision_required_by_hours: int
    complexity: str
    baseline_minutes: int
    target_minutes: int
    status: str
    next_action: Optional[str] = None
    created_at: str

class TimelineEventResponse(BaseModel):
    id: str
    case_id: str
    timestamp: str
    event_type: str
    subtype: str
    specimen_id: Optional[str] = None
    result_date: str
    received_date: str
    evidence_state: str
    is_preliminary: bool
    is_final: bool
    freshness_threshold_days: int
    is_stale: bool
    title: str
    summary: str
    full_report: Optional[str] = None
    report_id: Optional[str] = None
    visible_roles: List[str]
    freshness_badge: Dict[str, Any]

class FreshnessSummaryResponse(BaseModel):
    case_id: str
    fresh_count: int
    stale_count: int
    missing_count: int
    preliminary_count: int
    superseded_count: int
    total_count: int

class DecisionCreateRequest(BaseModel):
    case_id: str
    decision_text: str
    treatment_pathway: str  # Surgery, Neoadjuvant Therapy, Chemo-RT, Targeted Therapy, Surveillance
    consensus_level: str    # Unanimous, Majority, Conditional
    contingency_action: Optional[str] = None
    evidence_reviewed: List[str]  # List of event IDs reviewed
    stale_risk_acknowledged: bool = False

class DecisionResponse(BaseModel):
    id: str
    case_id: str
    submitted_by_user_id: str
    submitted_by_name: str
    submitted_by_role: str
    decision_text: str
    treatment_pathway: str
    consensus_level: str
    contingency_action: Optional[str] = None
    evidence_reviewed: List[str]
    stale_risk_acknowledged: bool
    status: str
    created_at: str

class AcknowledgeStaleDataRequest(BaseModel):
    case_id: str
    event_ids: List[str]
    rationale: str

class AuditLogEntry(BaseModel):
    id: str
    case_id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: str
    user_role: str
    action: str
    details: str
    status: str
    ip_address: Optional[str] = None
    timestamp: str

class SpecimenNode(BaseModel):
    id: str
    case_id: str
    label: str
    type: str
    parent_id: Optional[str] = None
    status: str
    collection_date: str
    anatomic_site: Optional[str] = None
    notes: Optional[str] = None
    children: List["SpecimenNode"] = Field(default_factory=list)

class NotificationResponse(BaseModel):
    id: str
    case_id: Optional[str] = None
    recipient_role: Optional[str] = None
    title: str
    message: str
    category: str
    is_read: bool
    created_at: str

class IntegrationStatus(BaseModel):
    name: str
    protocol: str
    endpoint: str
    status: str  # Connected, Degraded, Offline
    latency_ms: int
    last_handshake: str
    details: str

class SystemIntegrationsResponse(BaseModel):
    pacs: IntegrationStatus
    lis: IntegrationStatus
    genomics_lab: IntegrationStatus
    ehr: IntegrationStatus
    overall_status: str
