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

# ─── External Scan Ingestion & Network Resilience Models ─────────────────────

class ExternalScanIngestResponse(BaseModel):
    status: str
    ingestion_id: str
    case_id: str
    series_instance_uid: Optional[str] = None
    accession_number: Optional[str] = None
    modality: str
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    retry_count: int = 0
    elapsed_ms: int = 0
    freshness_state: str = "fresh"
    timeline_event_id: Optional[str] = None
    message: str

class PacsFetchStudyRequest(BaseModel):
    case_id: str
    accession_number: str
    remote_pacs_endpoint: str = "https://pacs.regional-hospital.org/dicomweb"
    series_instance_uid: Optional[str] = None
    modality: str = "CT"
    timeout_seconds: float = 3.0
    max_retries: int = 3
    simulate_network_condition: Optional[str] = None  # None, "TIMEOUT", "PACKET_DROP_RECOVER", "504_GATEWAY"

class PacsFetchStudyResponse(BaseModel):
    status: str
    case_id: str
    accession_number: str
    series_instance_uid: str
    modality: str
    attempts_made: int
    elapsed_ms: int
    circuit_breaker_state: str  # CLOSED, HALF_OPEN, OPEN
    timeline_event_id: Optional[str] = None
    message: str

# ─── Usability Rubric & System Usability Scale (SUS) Models ──────────────────

class SusAnswers(BaseModel):
    q1_frequently_use: int = Field(..., ge=1, le=5, description="I think that I would like to use this system frequently.")
    q2_complex: int = Field(..., ge=1, le=5, description="I found the system unnecessarily complex.")
    q3_easy_to_use: int = Field(..., ge=1, le=5, description="I thought the system was easy to use.")
    q4_need_support: int = Field(..., ge=1, le=5, description="I think that I would need the support of a technical person to be able to use this system.")
    q5_well_integrated: int = Field(..., ge=1, le=5, description="I found the various functions in this system were well integrated.")
    q6_inconsistency: int = Field(..., ge=1, le=5, description="I thought there was too much inconsistency in this system.")
    q7_learn_quickly: int = Field(..., ge=1, le=5, description="I would imagine that most people would learn to use this system very quickly.")
    q8_cumbersome: int = Field(..., ge=1, le=5, description="I found the system very cumbersome to use.")
    q9_confident: int = Field(..., ge=1, le=5, description="I felt very confident using the system.")
    q10_learn_a_lot: int = Field(..., ge=1, le=5, description="I needed to learn a lot of things before I could get going with this system.")

def calculate_sus_score(answers: SusAnswers) -> float:
    """
    Standard System Usability Scale (SUS) scoring formula:
    - Odd items (1, 3, 5, 7, 9): score - 1
    - Even items (2, 4, 6, 8, 10): 5 - score
    - Sum of contributions multiplied by 2.5 gives 0-100 score.
    """
    odd_sum = (
        (answers.q1_frequently_use - 1) +
        (answers.q3_easy_to_use - 1) +
        (answers.q5_well_integrated - 1) +
        (answers.q7_learn_quickly - 1) +
        (answers.q9_confident - 1)
    )
    even_sum = (
        (5 - answers.q2_complex) +
        (5 - answers.q4_need_support) +
        (5 - answers.q6_inconsistency) +
        (5 - answers.q8_cumbersome) +
        (5 - answers.q10_learn_a_lot)
    )
    return float(round((odd_sum + even_sum) * 2.5, 1))

class TaskEaseRatings(BaseModel):
    task1_case_intake_and_freshness: Optional[int] = Field(None, ge=1, le=7)
    task2_external_scan_ingestion: Optional[int] = Field(None, ge=1, le=7)
    task3_specimen_lineage_trace: Optional[int] = Field(None, ge=1, le=7)
    task4_decision_recording: Optional[int] = Field(None, ge=1, le=7)
    task5_audit_trail_inspection: Optional[int] = Field(None, ge=1, le=7)

class UsabilityEvaluationRequest(BaseModel):
    sus_answers: SusAnswers
    task_ratings: Optional[TaskEaseRatings] = None
    qualitative_feedback: Optional[str] = None
    clinical_role: Optional[str] = None

class UsabilityEvaluationResponse(BaseModel):
    id: str
    sus_score: float
    grade: str  # A+, A, B, C, D, F
    adjective: str  # Best Imaginable, Excellent, Good, OK, Poor
    evaluator_role: str
    message: str
    created_at: str

