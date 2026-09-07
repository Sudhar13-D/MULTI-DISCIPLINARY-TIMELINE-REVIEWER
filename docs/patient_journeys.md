# Clinical Patient Journey Definitions

This document specifies the longitudinal clinical scenarios, evidence event timelines, decision parameters, and failure recovery pathways for the system's two core benchmark journeys.

---

## Patient Journey 1: Urgent (Emergency MDT Case 001)

### 1. Patient Profile
- **Identifier**: `Case-001` (De-identified: `Patient A`)
- **Age / Sex**: 68M
- **Presenting Complaint**: Acute pleuritic chest pain, tachypnea, severe hypoxia ($SpO_2$ 91% on room air)
- **Clinical Urgency**: `STAT / Urgent` (Binding MDT decision required within 2 hours)
- **Referring Service**: Emergency Medicine & Acute Respiratory Team
- **Clinical Question**: Is acute pulmonary embolism (PE) confirmed on CT angiogram? Does the 6-month-old pulmonary nodule biopsy play a role in acute anticoagulation safety?

### 2. Longitudinal Evidence Sequence
1. **$T = 0$ min — STAT CT Pulmonary Angiogram Ordered**:
   - Modality: Imaging (CT Chest PE protocol with IV contrast)
   - Status: `ORDERED`
2. **$T = 60$ min — CT Scans Ingested into PACS**:
   - Preliminary Radiologist read: "Extensive saddle PE with right ventricular strain; no aortic dissection."
   - State: `PRELIMINARY` (Age: 0 days, Fresh ✓)
3. **$T = 75$ min — Radiologist Verified Report Signed**:
   - Verification by Dr. S. Chen: Final report signed with structured clot burden scores.
   - State: `FINAL` (Age: 0 days, Fresh ✓)
4. **$T = 80$ min — Automated Timeline Assembly Triggered**:
   - Current Imaging: CT Angiogram (Fresh ✓, Final)
   - Historical Pathology: Right lower lobe core biopsy from 6 months ago (Age: 180 days; Threshold: 90 days → `STALE ⚠⚠`)
   - Molecular Assay: Not ordered / not applicable to acute thromboembolism → `MISSING` (Documented as not required)
5. **$T = 100$ min — Emergency MDT Convened**:
   - System flags:
     - "Acute PE diagnosis confident based on fresh CT angiogram."
     - "Historical lung biopsy is STALE (180 days old) but benign; not contraindicating heparin."
     - "Molecular markers not required for emergency anticoagulation decision."
   - Clinician checks stale risk acknowledgment checkbox.
6. **$T = 120$ min — Binding MDT Decision Submitted**:
   - **Authorized Submitter**: Dr. Adams (MDT Chair)
   - **Recommended Pathway**: Immediate therapeutic anticoagulation (Unfractionated heparin bolus + continuous infusion followed by DOAC bridge)
   - **Contingencies**: "Serial aPTT monitoring at 6-hour intervals; repeat echocardiogram if hemodynamically unstable."
   - **Evidence Reviewed**: CT Chest PE Protocol (Fresh), Historical Lung Biopsy (Stale — acknowledged).
   - **Audit Record**: Immutable server-side timestamped entry created.

---

## Patient Journey 2: Routine (Weekly Oncology MDT Case 002)

### 1. Patient Profile
- **Identifier**: `Case-002` (De-identified: `Patient B`)
- **Age / Sex**: 54F
- **Presenting Diagnosis**: Colorectal adenocarcinoma, pre-operative staging
- **Clinical Urgency**: `ROUTINE` (MDT decision required within 7 days)
- **Referring Service**: Colorectal Surgery & Gastroenterology
- **Clinical Question**: Is the primary rectal lesion resectable with clear circumferential resection margins? Are regional lymph nodes involved? Is neoadjuvant chemotherapy or radiotherapy indicated based on MSI/MMR molecular status?

### 2. Longitudinal Evidence Sequence
1. **$T = 0$ days — Endoscopic Biopsy Performed**:
   - Specimen: Rectal mass biopsy (`SPEC-7100-A`)
   - Status: `RECEIVED` in Pathology
2. **$T = 1$ day — Gross Dissection & Cassette Preparation**:
   - Cassettes processed into formalin-fixed paraffin-embedded blocks (`SPEC-7100-B`)
   - Status: `IN PROCESS`
3. **$T = 2$ days — Preliminary Histopathology Signed**:
   - Microscopy: Invasive adenocarcinoma (moderately differentiated), lymphovascular invasion identified. MMR IHC ordered reflexively.
   - State: `PRELIMINARY` (Age: 0 days, Fresh ✓)
4. **$T = 2.5$ days — High-Resolution Pelvic MRI Ordered**:
   - Modality: Pelvic MRI with rectal cancer staging protocol (T2 weighted sequences)
5. **$T = 3$ days — Pelvic MRI Performed**:
   - Images captured and transferred via DICOMweb.
6. **$T = 4$ days — Radiologist MRI Staging Report Verified**:
   - Findings: T4b anterior rectal lesion invading peritoneal reflection; 3 suspicious mesorectal nodes ($LN_1$–$LN_3$ measuring 12–16 mm); circumferential resection margin threatened anteriorly (< 1 mm).
   - State: `FINAL` (Age: 1 day, Fresh ✓)
7. **$T = 6$ days — Molecular MSI/MMR Panel Completed**:
   - Assay: Reflex IHC for MLH1, MSH2, MSH6, PMS2.
   - Result: Intact nuclear expression across all four proteins → Microsatellite Stable (MSS / MMR-proficient).
   - State: `FINAL` (Age: 1 day, Fresh ✓)
8. **$T = 7$ days — MDT Board Meeting Assembly**:
   - Auto-assembled Evidence State:
     - Endoscopic Biopsy Report: Final (Age: 5 days; Threshold: 90 days → Fresh ✓)
     - Pelvic MRI Staging: Final (Age: 3 days; Threshold: 60 days → Fresh ✓)
     - Molecular MMR/MSI: Final (Age: 1 day; Threshold: 21 days → Fresh ✓)
     - Historical Baseline Abdominal CT (2 months old): Final (Age: 65 days; Threshold: 30 days → Stale ⚠, retained for baseline comparison)
   - Specimen Lineage Tree:
     - `SPEC-7100-A` (Endoscopic Biopsy) → `SPEC-7100-B` (FFPE Block) → `SPEC-7101-A` (H&E Slides) & `SPEC-7101-B` (MMR IHC Slides).
9. **$T = 7$ days — Binding MDT Decision Submitted**:
   - **Authorized Submitter**: Sarah MDT (MDT Coordinator) with Chair Co-signature
   - **Recommended Pathway**: Neoadjuvant total neoadjuvant therapy (TNT) followed by robotic anterior resection
   - **Rationale**: T4b N2 disease with threatened CRM requires preoperative downstaging; MSS phenotype indicates standard fluoropyrimidine + oxaliplatin chemotherapy regimen.
   - **Contingencies**: "Restaging pelvic MRI at week 12 post-neoadjuvant therapy to confirm CRM clearance before definitive resection."
   - **Evidence Checked**: Biopsy Histology, Pelvic MRI, MMR/MSI report.
