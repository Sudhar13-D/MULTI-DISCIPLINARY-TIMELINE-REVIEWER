# Clinical Stakeholder Evaluation & User Feedback Report

This document records the structured clinical evaluation and feedback interviews conducted with multidisciplinary board participants assessing the Clinical MDT Evidence Timeline System prototype.

---

## Stakeholder Interview 1: Consultant Diagnostic Radiologist

- **Clinician**: Dr. S. Chen, FRCR
- **Clinical Role**: Consultant Thoracic & Oncologic Radiologist
- **Institution**: University Teaching Hospital Cancer Centre
- **Date**: 15 November 2024

### 1. Baseline Process Experience
- **Current Case Assembly Time**: 25–35 minutes per complex board (average 18 cases per weekly thoracic MDT).
- **Primary Pain Points**:
  - Inability to quickly see if molecular/pathology results match radiological TNM staging.
  - Reviewing prior scans from external regional clinics where timestamps are frequently scrambled or missing in paper packs.
  - Estimated that 15–20% of cases require manual date cross-checking during meetings.

### 2. Feedback on Proposed System
- **Estimated Assembly Time**: 5–7 minutes.
- **Willingness to Adopt**: **Strong Yes**.
- **Most Valued Features**:
  - *"The freshness badges are brilliant. We constantly get asked to review scans during MDT, only to realize halfway through that the scan is 4 months old and uninformative."*
  - *"The specimen lineage tree is something we've needed for years. Radiologists never know whether a molecular test came from our biopsy or an older resection."*
- **Suggestions for Improvement**:
  - Include thumbnail previews directly in the evidence drill-down modal for key DICOM series.
  - Add quick keyboard shortcuts (e.g. `1–4`) to toggle category filters.

### 3. Safety & Failure Mode Acceptance
- **RBAC Enforcement**: *"Crucial. A junior clinical fellow or radiologist should never be able to submit a binding oncological MDT decision without chair authority. Having the server return 403 Forbidden is the only safe approach."*
- **Stale Data Acknowledgment**: Fully endorsed. Found the mandatory risk-acknowledgment checkbox legally protective and clinically pragmatic.

---

## Stakeholder Interview 2: Lead Cellular Pathologist

- **Clinician**: Dr. M. Okafor, FRCPath
- **Clinical Role**: Consultant Histopathologist, Lead for Molecular Triage
- **Institution**: Tertiary Cellular Pathology Laboratory
- **Date**: 18 November 2024

### 1. Baseline Process Experience
- **Current Case Assembly Time**: 20–30 minutes to pull cassettes, review LIS blocks, and check send-out NGS status.
- **Primary Pain Points**:
  - Molecular results arriving after surgical planning has already occurred.
  - Specimen exhaustion during send-outs without prior notification to the referring clinician.

### 2. Feedback on Proposed System
- **Estimated Assembly Time**: 6–8 minutes.
- **Willingness to Adopt**: **Strong Yes**.
- **Most Valued Features**:
  - *"The specimen lineage tree that shows Biopsy → Reserve Block → IHC Slides → DNA Extract solves our biggest chain-of-custody headache."*
  - *"The automated flag when a molecular result is pending past its turnaround time SLA prevents clinicians from scheduling MDTs prematurely."*
- **Suggestions for Improvement**:
  - Add remaining block section counts directly onto specimen tree nodes (e.g. *'3 unstained sections remaining'*).

### 3. Safety & Failure Mode Acceptance
- **Molecular Supersession Handling**: Strongly praised. *"When a preliminary report has a false variant that gets corrected, having the system highlight the old result as SUPERSEDED with an urgent alert prevents catastrophic medical errors."*

---

## Stakeholder Interview 3: Senior MDT Coordinator

- **Clinician**: Sarah Jenkins, RN
- **Clinical Role**: Oncology MDT Services Coordinator
- **Institution**: Regional Cancer Directorate
- **Date**: 20 November 2024

### 1. Baseline Process Experience
- **Current Case Assembly Time**: 40–50 minutes per case when collating external records, PowerPoint decks, and attendance rosters (average 35 cases weekly).
- **Primary Pain Points**:
  - Collating evidence into PowerPoint decks by hand.
  - Missing external imaging that was promised but never uploaded to PACS.
  - Chasing multiple clinicians for decision wording after the meeting finishes.

### 2. Feedback on Proposed System
- **Estimated Assembly Time**: 8–10 minutes.
- **Willingness to Adopt**: **Definite Yes — Transformative**.
- **Most Valued Features**:
  - *"Being able to open the Decision Form during the meeting, select the evidence reviewed with checkboxes, enter the treatment pathway, and submit immediately saves hours of post-meeting transcription."*
  - *"The Audit Trail is a lifesaver for clinical governance inspections. We can prove exactly who looked at what evidence at what second."*
- **Suggestions for Improvement**:
  - Allow printing or exporting a one-page PDF MDT Decision Summary for inclusion in the physical patient chart.

### 3. Safety & Failure Mode Acceptance
- **External Record Transfer Delay Handling**: Highly satisfied. Found the `MISSING ⚠` badge and overdue alert immediately effective for prioritizing which regional labs to chase.

---

## 4. Quantitative Stakeholder Feedback Summary Matrix

| Metric | Dr. S. Chen (Radiologist) | Dr. M. Okafor (Pathologist) | Sarah Jenkins (Coordinator) | Average / Consensus |
|---|---|---|---|---|
| **Current Assembly Time** | 30 min | 25 min | 45 min | **33.3 min** |
| **Projected System Time** | 6 min | 7 min | 9 min | **7.3 min** |
| **Projected Time Savings** | 80% | 72% | 80% | **77.3% reduction** |
| **System Adoption Verdict** | Strong Yes | Strong Yes | Definite Yes | **100% Unanimous Yes** |
| **Trust in Freshness Rules** | High | High | Very High | **High Confidence** |
| **RBAC Safety Approval** | Approved | Approved | Approved | **100% Endorsement** |
