"""
Pydantic Schema Validation for Clinical MDT Synthetic Data Generator
Enforces rigorous clinical integrity constraints, HIPAA de-identification formats,
and FHIR/DICOM/HL7 alignment.
"""

from enum import Enum
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

class EvidenceState(str, Enum):
    ORDERED = "ordered"
    RECEIVED = "received"
    PRELIMINARY = "preliminary"
    FINAL = "final"
    STALE = "stale"
    MISSING = "missing"
    UNAVAILABLE = "unavailable"
    SUPERSEDED = "superseded"

class EventType(str, Enum):
    IMAGING = "imaging"
    PATHOLOGY = "pathology"
    MOLECULAR = "molecular"
    CLINICAL_NOTES = "clinical_notes"
    REVIEW = "review"
    EXTERNAL_DOCUMENT = "external_document"

class UrgencyLevel(str, Enum):
    URGENT = "urgent"
    ROUTINE = "routine"
    EXPEDITED = "expedited"
    ELECTIVE = "elective"

class ComplexityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

VALID_ROLES = {"chair", "coordinator", "radiologist", "pathologist", "molecular", "clinician"}

# ─── Timeline Event Schema ───────────────────────────────────────────────────

class TimelineEventSchema(BaseModel):
    id: str = Field(..., description="Unique event identifier (e.g. ev-001-1)")
    timestamp: str = Field(..., description="ISO 8601 creation or encounter timestamp")
    event_type: EventType = Field(..., description="High-level category (imaging, pathology, molecular)")
    subtype: str = Field(..., description="Specific diagnostic modality or assay (e.g. ct_chest, biopsy, ngs_panel)")
    specimen_id: Optional[str] = Field(None, description="FK to parent specimen hierarchy if applicable")
    result_date: str = Field(..., description="ISO 8601 date when study/assay was completed")
    received_date: str = Field(..., description="ISO 8601 date when study/report was ingested")
    evidence_state: EvidenceState = Field(..., description="Clinical state machine state")
    is_preliminary: bool = Field(False, description="True if report requires consultant sign-off")
    is_final: bool = Field(True, description="True if definitive authorized report")
    freshness_threshold_days: int = Field(..., ge=1, le=365, description="Category-specific SLA freshness limit in days")
    is_stale: bool = Field(False, description="True if age exceeds freshness threshold")
    title: str = Field(..., min_length=3, description="Descriptive diagnostic title")
    summary: str = Field(..., min_length=5, description="Structured clinical findings summary")
    report_id: Optional[str] = Field(None, description="External accession or LIS/RIS report number")
    full_report: Optional[str] = Field(None, description="Unabridged medical narrative")
    visible_roles: List[str] = Field(default_factory=list, description="Roles authorized to view this event")

    @field_validator("timestamp", "result_date", "received_date")
    @classmethod
    def validate_iso_dates(cls, v: str) -> str:
        try:
            # Handles ISO strings with Z or timezone offsets
            clean = v.replace("Z", "+00:00")
            datetime.fromisoformat(clean)
            return v
        except Exception as e:
            raise ValueError(f"Invalid ISO 8601 date format '{v}': {e}")

    @field_validator("visible_roles")
    @classmethod
    def validate_roles(cls, v: List[str]) -> List[str]:
        for role in v:
            if role not in VALID_ROLES:
                raise ValueError(f"Invalid role '{role}' in visible_roles. Allowed: {VALID_ROLES}")
        return v

# ─── Specimen Lineage Schema ─────────────────────────────────────────────────

class SpecimenSchema(BaseModel):
    id: str = Field(..., min_length=3, description="Unique specimen accession ID (e.g. SPEC-001-A)")
    label: str = Field(..., min_length=2, description="Human-readable specimen label")
    type: str = Field(..., description="Specimen nature (e.g. Tissue Core, Reserve Block, DNA Extract)")
    parent_id: Optional[str] = Field(None, description="Parent specimen in chain-of-custody hierarchy")
    status: str = Field(..., description="Current laboratory status (e.g. Diagnostic, Archived, Exhausted)")
    collection_date: str = Field(..., description="ISO 8601 collection timestamp")
    anatomic_site: Optional[str] = Field(None, description="SNOMED CT anatomical origin")
    notes: Optional[str] = Field(None, description="Block section count or chain-of-custody remarks")

    @field_validator("collection_date")
    @classmethod
    def validate_collection_date(cls, v: str) -> str:
        try:
            clean = v.replace("Z", "+00:00")
            datetime.fromisoformat(clean)
            return v
        except Exception as e:
            raise ValueError(f"Invalid specimen collection date '{v}': {e}")

# ─── Test Case Schema ────────────────────────────────────────────────────────

class TestCaseSchema(BaseModel):
    case_id: str = Field(..., description="3-digit case code (e.g. '001')")
    patient_de_id: str = Field(..., pattern=r"^Patient_[A-Z]_\d{1,3}[MF]$", description="HIPAA Safe Harbor pseudonym (e.g. Patient_A_68M)")
    age: int = Field(..., ge=0, le=120, description="Patient age at MDT review")
    sex: str = Field(..., pattern=r"^[MF]$", description="Biological sex (M/F)")
    primary_dx: str = Field(..., min_length=5, description="Primary oncologic or surgical diagnosis")
    referring_dept: str = Field(..., min_length=3, description="Referring clinical department")
    urgency: UrgencyLevel = Field(..., description="Clinical triage urgency")
    decision_required_by_hours: int = Field(..., gt=0, description="Decision SLA in hours (e.g. 2 for STAT, 168 for routine)")
    complexity: ComplexityLevel = Field(..., description="Clinical and multidisciplinary complexity tier")
    has_external_imaging: bool = Field(False)
    has_missing_pathology: bool = Field(False)
    has_molecular_result: bool = Field(False)
    has_stale_evidence: bool = Field(False)
    has_missing_evidence: bool = Field(False)
    expected_decision_time_minutes: int = Field(..., gt=0)
    baseline_minutes: int = Field(..., gt=0, description="Legacy paper-based assembly time (minutes)")
    target_minutes: int = Field(..., gt=0, description="Target digital MDT review time (minutes)")
    timeline_events: List[TimelineEventSchema] = Field(default_factory=list)
    specimens: List[SpecimenSchema] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_clinical_consistency(self):
        # 1. Target time must represent efficiency improvement over baseline
        if self.target_minutes > self.baseline_minutes:
            raise ValueError(f"Target assembly time ({self.target_minutes}m) must not exceed baseline ({self.baseline_minutes}m)")

        # 2. Specimen ID cross-reference check
        specimen_ids = {s.id for s in self.specimens}
        for ev in self.timeline_events:
            if ev.specimen_id and ev.specimen_id not in specimen_ids:
                raise ValueError(f"Timeline event '{ev.id}' references specimen '{ev.specimen_id}' not found in case specimens {specimen_ids}")

        # 3. Specimen tree integrity: parent_id must exist in specimens
        for sp in self.specimens:
            if sp.parent_id and sp.parent_id not in specimen_ids:
                raise ValueError(f"Specimen '{sp.id}' references parent '{sp.parent_id}' not in case specimen set")

        # 4. Feature flag consistency: molecular result
        if self.has_molecular_result:
            mol_events = [e for e in self.timeline_events if e.event_type == EventType.MOLECULAR]
            if not mol_events:
                raise ValueError(f"Case '{self.case_id}' has has_molecular_result=True but contains no molecular timeline events")

        return self

# ─── Dataset Root Schema ─────────────────────────────────────────────────────

class BenchmarkDatasetSchema(BaseModel):
    cases: List[TestCaseSchema] = Field(..., min_length=1, description="List of benchmark clinical test cases")

    @model_validator(mode="after")
    def validate_global_dataset_integrity(self):
        case_ids = [c.case_id for c in self.cases]
        if len(case_ids) != len(set(case_ids)):
            duplicates = [cid for cid in case_ids if case_ids.count(cid) > 1]
            raise ValueError(f"Duplicate case_ids detected in benchmark dataset: {set(duplicates)}")

        patient_ids = [c.patient_de_id for c in self.cases]
        if len(patient_ids) != len(set(patient_ids)):
            duplicates = [pid for pid in patient_ids if patient_ids.count(pid) > 1]
            raise ValueError(f"Duplicate patient_de_ids detected in benchmark dataset: {set(duplicates)}")

        return self
