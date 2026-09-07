# Clinical MDT Evidence Timeline System: Presentation Deck & Demo Script

---

## Slide 1: Title Slide
- **Title**: Clinical Multidisciplinary Team (MDT) Evidence Timeline System
- **Subtitle**: Safety-Critical Longitudinal Decision Support for Oncology & Pathology
- **Presenter**: Clinical Informatics & Advanced Engineering Team
- **Context**: Capstone Demonstration & Clinical Validation

---

## Slide 2: The Clinical Problem
- **The Challenge**: Diagnostic and prognostic cancer data is siloed across disconnected hospital subsystems:
  - Radiology reports locked in PACS
  - Histology and cytology locked in Laboratory Information Systems (LIS)
  - Molecular biomarker assays locked in external send-out portals or email
- **Current As-Is Assembly Reality**:
  - MDT Coordinators spend **30 minutes per complex case** hand-copying text into static PowerPoint slides.
  - **15% error rate** in data assembly observed in clinical audits.
  - Critical temporal errors (inverted event dates) occur in manual assembly.
  - Stale imaging older than 60 days is repeatedly presented without clinicians realizing its age.

---

## Slide 3: The Proposed Solution
- **A Unified Clinical Evidence Platform**:
  - **Automated Longitudinal Timeline**: Single view unifying Imaging, Pathology, Molecular, and MDT Reviews.
  - **Rules-Based Freshness Engine**: Dynamic badges (`Fresh ✓`, `Stale ⚠⚠`, `Preliminary ⚠`, `Missing ✗`) with clinical thresholds.
  - **Explorable Specimen Lineage Tree**: Biopsy → Reserve FFPE Blocks → IHC Slides → DNA Extracts.
  - **Binding Decision Recording with RBAC**: Server-side role validation allowing only authorized Chair/Coordinator sign-off.
  - **Immutable Audit Trail**: 100% server-side timestamped logging of every view, action, and security rejection.

---

## Slide 4: System Architecture
- **Client Layer**: React 19, TypeScript 5.7, Tailwind CSS v4, Resizable Multi-Panel UX.
- **Service Layer**: FastAPI (Python 3.13), RESTful API, PBKDF2-HMAC-SHA256 Auth, Strict RBAC Middleware.
- **Persistence Layer**: SQLite with Write-Ahead Logging (WAL) for atomic transaction persistence.
- **Integration Layer**: Live DICOMweb (PACS) and HL7/FHIR (LIS) health status plumbing.

---

## Slide 5: Patient Journey 1 — Urgent Emergency MDT (Case 001)
- **Profile**: 68-year-old male with acute pleuritic chest pain and severe hypoxia.
- **Scenario**: STAT decision required within 2 hours for acute Saddle Pulmonary Embolism.
- **System Execution**:
  - Fresh CT Angiogram ingested in 60 minutes (`Fresh ✓`, Final).
  - 6-month-old lung biopsy automatically flagged as `STALE ⚠⚠` (180 days old).
  - Missing molecular assay flagged but recognized as non-blocking for acute anticoagulation.
  - Clinician checks stale risk acknowledgment.
  - MDT Chair submits binding therapeutic anticoagulation decision in **7 minutes** (vs 45 min baseline).

---

## Slide 6: Patient Journey 2 — Routine Staging MDT (Case 002)
- **Profile**: 54-year-old female with T4b N2 Rectal Adenocarcinoma.
- **Scenario**: Pre-operative staging and neoadjuvant therapy planning.
- **System Execution**:
  - All evidence assembled in chronological order with zero date errors.
  - Interactive Specimen Lineage tree traces mucosal biopsy `SPEC-002-A` through block `SPEC-002-B` to MMR slide `SPEC-002-C`.
  - All freshness badges green (`Fresh ✓`).
  - Binding decision recorded for total neoadjuvant therapy + robotic resection.

---

## Slide 7: Failure Mode Testing & Clinical Edge Cases
- **Failure Mode 1: External Centre Record Delay (Case 003)**:
  - System flags missing scan as `MISSING ⚠`, alerts coordinator, prevents premature discussion, and automatically flips to `Fresh ✓` once uploaded.
- **Failure Mode 2: Molecular Report Correction & Supersession (Case 004)**:
  - Preliminary EGFR false-positive result marked `SUPERSEDED ✗`; corrected final KRAS G12C variant ingested with urgent notification.
- **Failure Mode 3: Stale Imaging in Acute Assessment (Case 005)**:
  - System enforces mandatory stale data acknowledgment before allowing decision submission.

---

## Slide 8: Quantitative Experimental Results
- **Benchmark Evaluation across 10 Clinical Cases**:
  - **Assembly Time Reduction**: **76.6%** (from 28.2 min manual down to 6.6 min automated).
  - **Assembly Error Reduction**: **100% reduction in unflagged errors** (from 0.8 errors/case to 0.0).
  - **Staleness Capture Rate**: **100%** of stale evidence caught by algorithmic thresholds.
  - **Audit Compliance**: **100%** automated server-side capture.

---

## Slide 9: Stakeholder Validation Feedback
- **Consultant Radiologist**: *"The freshness badges are brilliant... having the server return 403 Forbidden for unauthorized decision attempts is the only safe approach."*
- **Lead Pathologist**: *"The specimen lineage tree solves our biggest chain-of-custody headache. Marking superseded reports prevents catastrophic medical errors."*
- **Senior MDT Coordinator**: *"Saves hours of post-meeting transcription. Definite yes."*
- **Verdict**: **100% Unanimous Clinical Endorsement**.

---

## Slide 10: Live Demonstration Walkthrough Script
1. **Login Flow**: Log in as `prof.adams@hospital.org` (MDT Chair) using PBKDF2 authentication.
2. **Case Selection**: Select `Case 001` (STAT PE) and review the auto-assembled timeline.
3. **Freshness Drill-down**: Click historical lung biopsy to observe `STALE ⚠⚠` calculation.
4. **Lineage Inspection**: Open `Case 002` and navigate the specimen tree.
5. **RBAC Guard Test**: Switch user to `dr.chen@hospital.org` (Radiologist); attempt decision submission; demonstrate real `HTTP 403 Forbidden` response.
6. **Authorized Submission**: Switch back to Chair; fill treatment pathway and contingencies; submit binding decision.
7. **Audit Trail Verification**: Open Audit Drawer to prove both the security rejection and decision submission are immutably logged with timestamps.
8. **Document Upload**: Attach an external DICOM report and watch it integrate into the live timeline.
9. **Integrations Health**: Observe real PACS / LIMS live latency in the bottom status bar.
