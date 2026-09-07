# Clinical Failure Mode Analysis & Edge Case Validation

This document records the systematic validation of the system under clinical failure modes and edge cases, detailing root causes, real-time system responses, audit entries, and clinical safety mitigations.

---

## Failure Mode 1: External Centre Record Transfer Delay

### 1. Clinical Scenario
- **Test Case**: `Case 003` (Patient C, 62M)
- **Clinical Setting**: Urgent GP referral for suspected right upper lobe cavitary lung lesion.
- **Trigger Event**: Diagnostic CT thorax was performed at an external regional health centre 4 days prior. The physical disc/DICOM transfer was delayed in postal transit, leaving the local MDT without verified imaging upon initial case registration.

### 2. Timeline of System Behavior

| Elapsed Time | Data Pipeline State | System UI Presentation | Automated System Action |
|---|---|---|---|
| **Day 1** (Order Date) | Transfer initiated | Case registered. Timeline displays: `External CT Thorax (ORDERED)`. Badge: `Waiting...` (gray). | Scheduled background query to regional Health Information Exchange (HIE). |
| **Days 2–4** (Delay Phase) | Transfer unfulfilled | Ingestion check fails SLA (> 24h). Badge switches to `MISSING ⚠` (red alert). | Automated dispatch of urgent push alert to MDT Coordinator: *"External imaging overdue (> 24h) for Case 003"*. |
| **Day 5** (Arrival) | Secure file ingestion | DICOM files uploaded and validated via `/api/cases/003/documents`. | Evidence state automatically flips from `MISSING` to `FINAL`. Freshness badge turns `FRESH ✓` (green). |

### 3. Verification Evidence & Audit Entries
- **Audit Log Event**: `DOCUMENT_UPLOADED`
  - User: `sarah.mdt@hospital.org` (MDT Coordinator)
  - Detail: *"Uploaded 'EXT-RAD-003_CT_Thorax.dcm' (14,280 KB). Case timeline updated automatically."*
- **Clinical Safety Consequence**:
  - **Without Proposed System**: Clinicians risk discussing the case with unverified phone notes or premature bronchoscopy triage.
  - **With Proposed System**: System overtly halts premature consensus, alerts coordinator to expedite file transfer, and seamlessly integrates scan upon arrival.

---

## Failure Mode 2: Molecular Assay Correction & Supersession

### 1. Clinical Scenario
- **Test Case**: `Case 004` (Patient D, 71F)
- **Clinical Setting**: Non-Small Cell Lung Cancer (NSCLC) Stage IIIA.
- **Trigger Event**: External molecular genetics laboratory transmits a preliminary NGS report on Day 3 indicating an *EGFR Exon 19 deletion*. On Day 7, quality control re-extraction reveals baseline calibration noise; the preliminary report is formally revoked and superseded by a corrected final report demonstrating *EGFR Wild-Type* with a pathogenic *KRAS G12C* driver mutation.

### 2. Longitudinal System Response

```
Day 3: Preliminary Result Ingested
  ├─ Evidence State: PRELIMINARY
  ├─ Badge: PRELIMINARY ⚠ (Orange)
  └─ UI Text: "NGS Panel (Preliminary — 3 days old) — Pending consultant sign-off"

Day 5: Interstitial MDT Meeting
  ├─ Clinician Action: Prof. Adams opens Decision Form
  ├─ System Guard: UI displays prominent warning:
  │  "Active evidence contains preliminary unverified assays."
  ├─ Clinician Acknowledgment: Checks required box:
  │  [x] "I acknowledge this decision relies on preliminary data and includes contingency."
  └─ Decision Submitted: "Targeted EGFR TKI provisionally recommended pending final NGS."

Day 7: Corrected Final Assay Ingested
  ├─ Automated State Machine Transition:
  │  ├─ Original Report (MOL-2024-PRE04): State flipped to SUPERSEDED ✗ (Grey/Crossed)
  │  └─ Corrected Report (MOL-2024-FINAL04): State marked FINAL, Badge FRESH ✓ (Green)
  ├─ Real-Time Safety Alert Fired:
  │  "URGENT CLINICAL ALERT: Preliminary NGS result used in Day 5 decision has been SUPERSEDED.
  │   Prior variant: EGFR Exon 19 del. Final variant: KRAS G12C. Immediate case review required."
  └─ Audit Trail: Immutable dual records preserved for clinical governance.
```

### 3. Verification & Clinical Safety Impact
- **Audit Log Events**:
  1. `DECISION_SUBMITTED`: *"Pathway: Targeted EGFR TKI (Conditional on final NGS verification)."*
  2. `SUPERSEDED_ASSAY_RECORDED`: *"MOL-2024-PRE04 marked SUPERSEDED by MOL-2024-FINAL04. Alert sent to Medical Oncology."*
- **Clinical Consequence**: Prevents inappropriate commencement of costly, ineffective tyrosine kinase inhibitors; prompts immediate switch to sotorasib / chemo-immunotherapy.

---

## Failure Mode 3: Stale Baseline Imaging in STAT Acute Assessment

### 1. Clinical Scenario
- **Test Case**: `Case 005` (Patient E, 59M)
- **Clinical Setting**: Acute Emergency Surgical Admission with Severe RUQ Pain.
- **Trigger Event**: Patient has an abdominal liver MRI performed 90 days earlier for a benign hemangioma. The emergency team requests STAT MDT review to determine if acute biliary pathology is present, relying on the old MRI because no new cross-sectional scan has been performed yet.

### 2. System Guardrails & Enforced Workflow

```
Evidence Ingestion & Staleness Computation:
  • Modality: MRI Abdomen
  • Result Date: 90 days ago
  • Threshold: fresh_until = 14 days, stale_after = 60 days
  • Computed State: STALE ⚠⚠ (Red badge, age exceeds 60d limit)

System Warning Banner:
  "CRITICAL TIMELINE ALERT: Available abdominal MRI is 90 days old (Threshold: 60 days).
   Recent clinical deterioration cannot be excluded using stale imaging. Repeat study strongly advised."

Clinician Decision Form Constraints:
  • System disables uncritical sign-off.
  • Clinician MUST check mandatory risk acknowledgment:
    [x] "I explicitly acknowledge that available imaging is STALE and may not reflect acute pathology."
  • Mandatory Rationale Field: Clinician inputs reason:
    "MRI used for chronic baseline reference only; bedside ultrasound performed today confirms acute cholecystitis."
  • Contingency Requirement:
    "Urgent laparoscopic cholecystectomy authorized; proceed to on-table cholangiogram."
```

### 3. Verification & Governance Record
- **Audit Log Event**: `STALE_DATA_ACKNOWLEDGED`
  - Action: *"Clinician acknowledged reliance on stale evidence ['ev-005-1']. Rationale logged."*
- **Clinical Consequence**: Protects the patient from erroneous assumption that negative 90-day MRI rules out acute surgical disease, while legally documenting the clinical rationale for proceeding.
