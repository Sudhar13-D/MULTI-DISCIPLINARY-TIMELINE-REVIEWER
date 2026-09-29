# Synthetic Clinical Data Generator & Schema Validation Specification

## 1. Executive Summary & Purpose

The **Clinical MDT Synthetic Data Generator** produces high-fidelity, clinically authentic, de-identified patient test trajectories for multidisciplinary tumor and clinical boards. It enables rigorous end-to-end integration testing, time-and-motion assembly benchmarks, and failure mode verification without exposing protected health information (PHI).

The generator guarantees **100% schema compliance** via Pydantic v2 validation models and standard JSON Schema definitions, ensuring strict data integrity before writing to persistent storage or feeding into machine learning pipelines.

---

## 2. Regulatory Compliance: HIPAA Safe Harbor De-Identification

The synthetic generator implements the **HIPAA Privacy Rule Safe Harbor Method (45 CFR § 164.514(b)(2))** by stripping all 18 direct identifiers and substituting them with mathematically structured clinical pseudonyms:

| Safe Harbor Identifier Removed | Synthetic Representation | Clinical Justification |
|---|---|---|
| **Patient Names** | `Patient_[A-J]_[Age][Sex]` (e.g. `Patient_A_68M`) | Obfuscates identity while preserving demographic context essential for MDT risk assessment. |
| **All Geographic Subdivisions** | Abstracted regional entities (e.g. *"Regional General Hospital"*) | Prevents zip-code or territorial triangulation. |
| **Exact Calendar Dates** | Relative dynamic offsets: `(now - timedelta(days=X))` | Maintains true longitudinal chronology (order date → result date → meeting date) without static historical dates. |
| **Telephone / Fax Numbers** | Completely excluded | Zero communication metadata retained. |
| **Email Addresses** | Standard synthetic domain (`user@hospital.org`) | Isolated to local sandbox authentication. |
| **Social Security Numbers** | Excluded | N/A |
| **Medical Record Numbers (MRN)** | De-identified accession formats (`ACC-EXT-2024-001`) | Format matches real hospital PACS/LIS accessions without mapping to genuine patient charts. |
| **Health Plan Beneficiary IDs** | Excluded | N/A |
| **Account Numbers** | Excluded | N/A |
| **Certificate/License Numbers** | Standard professional titles (FRCR, FRCPath, FRCP) | Reflects clinician seniority without real GMC/license numbers. |
| **Vehicle Identifiers** | Excluded | N/A |
| **Device Identifiers & Serial Nos** | Generalized modality descriptors (*"Helical CT 64-slice"*) | Preserves technical fidelity without hardware MAC/serial correlation. |
| **Web Universal Resource Locators** | Internal mock endpoints (`https://pacs.hospital.internal`) | Non-routable private hospital URIs. |
| **Internet Protocol Addresses** | Standard RFC 5737 documentation blocks / `127.0.0.1` | Local loopback isolation. |
| **Biometric Identifiers** | Excluded | N/A |
| **Full-Face Photographic Images** | Replaced with synthetic DICOM pixel arrays and SVG diagrams | Prevents visual facial recognition. |
| **Ages over 89** | Clamped to statutory limits (all synthetic ages 43–77) | Avoids demographic outlier identification. |
| **Any Other Unique Identifying Characteristic** | Standardized ICD-10 & SNOMED CT terminology | Fully generalized clinical phrasing. |

---

## 3. Clinical Scenario Taxonomy

The dataset encompasses 10 benchmark clinical trajectories covering diverse urgent and routine MDT oncology specialties:

```
                                  [ Benchmark Dataset (10 Cases) ]
                                                │
         ┌──────────────────────────────────────┴──────────────────────────────────────┐
         ▼                                                                             ▼
   [ Urgent STAT Cases (≤ 24h) ]                                              [ Routine Oncology (7d) ]
   ├─ Case 001: STAT Saddle PE (2h SLA, 8 min target)                         ├─ Case 002: Rectal Adenocarcinoma (T4b N2)
   ├─ Case 003: Cavitary Lung Mass (External Scan Delay)                      ├─ Case 004: NSCLC (Molecular Supersession)
   └─ Case 005: Acute Abdomen (Stale 90d MRI Guardrail)                       ├─ Case 006: Breast Carcinoma (HER2+ FISH)
                                                                              ├─ Case 007: Prostate Gleason 9
                                                                              ├─ Case 008: Oropharyngeal SCC (p16+ HPV PCR)
                                                                              ├─ Case 009: Ovarian Carcinoma (BRCA1/2 NGS)
                                                                              └─ Case 010: Melanoma (BRAF V600E Mutation)
```

### Scenario Breakdown

1. **Case 001 (STAT PE - Emergency Review)**:
   - Primary Dx: Acute Saddle Pulmonary Embolism with Right Ventricular Strain.
   - Urgency: `urgent` (2h decision SLA).
   - Key Feature: Fast-track assembly (target 8 min vs 45 min baseline).
2. **Case 002 (Colorectal Staging - Complex Specimen Tree)**:
   - Primary Dx: Rectal Adenocarcinoma T4b N2 (MSS).
   - Specimen Provenance: Endoscopic Biopsy → Tissue Cassette → DNA Extract.
3. **Case 003 (External Scan Ingestion Delay - Failure Mode 1)**:
   - Primary Dx: Cavitary Lung Lesion.
   - Key Feature: Initial state has external scan marked `MISSING ⚠`. Dynamic ingestion flips evidence state to `FINAL` with `FRESH ✓` badge.
4. **Case 004 (Molecular Assay Correction - Failure Mode 2)**:
   - Primary Dx: Stage IIIA Non-Small Cell Lung Cancer.
   - Key Feature: Day 3 preliminary report (*EGFR del19*) superseded by Day 7 corrected report (*KRAS G12C*).
5. **Case 005 (Stale Baseline Imaging - Failure Mode 3)**:
   - Primary Dx: Severe RUQ Pain.
   - Key Feature: 90-day-old abdominal MRI flagged `STALE ⚠⚠`. Triggers mandatory risk acknowledgment before surgical decision sign-off.
6. **Case 006 (Infiltrating Ductal Breast Carcinoma)**:
   - Primary Dx: IDC Grade 3 with reflex HER2 Dual-Color FISH confirmation.
7. **Case 007 (High-Risk Prostate Adenocarcinoma)**:
   - Primary Dx: Gleason 4+5=9 Adenocarcinoma with targeted MRI-US fusion biopsy.
8. **Case 008 (Oropharyngeal Squamous Cell Carcinoma)**:
   - Primary Dx: Tonsil SCC with p16 IHC and high-risk HPV16 real-time PCR verification.
9. **Case 009 (High-Grade Serous Ovarian Carcinoma)**:
   - Primary Dx: Stage IIIC Ovarian Carcinoma with somatic BRCA1/2 NGS panel.
10. **Case 010 (Cutaneous Malignant Melanoma)**:
    - Primary Dx: Nodular Melanoma with BRAF V600E allele-specific PCR assay.

---

## 4. Schema Specification & Pydantic Validation Models

Data models are defined in [`data-generation/schemas.py`](file:///c:/Users/sudha/Documents/Multi%20Disciplinary/data-generation/schemas.py).

### 4.1 Field Dictionary

#### `TestCaseSchema`
| Field | Type | Validation Rules | Description |
|---|---|---|---|
| `case_id` | `str` | Must be non-empty unique string | Case identifier code (e.g. `'001'`). |
| `patient_de_id` | `str` | Regex: `^Patient_[A-Z]_\d{1,3}[MF]$` | De-identified Safe Harbor pseudonym. |
| `age` | `int` | `0 <= age <= 120` | Patient age in years. |
| `sex` | `str` | Regex: `^[MF]$` | Biological sex indicator. |
| `primary_dx` | `str` | `min_length=5` | Formal diagnostic heading. |
| `referring_dept` | `str` | `min_length=3` | Clinical origin (e.g. Emergency, Urology). |
| `urgency` | `UrgencyLevel` | `'urgent' \| 'routine' \| 'expedited'` | Triage priority tier. |
| `decision_required_by_hours` | `int` | `> 0` | Regulatory SLA deadline in hours. |
| `complexity` | `ComplexityLevel` | `'low' \| 'medium' \| 'high'` | Case complexity assessment. |
| `baseline_minutes` | `int` | `> 0` | Legacy manual assembly duration. |
| `target_minutes` | `int` | `target_minutes <= baseline_minutes` | Platform target assembly duration. |
| `timeline_events` | `List[TimelineEventSchema]` | Non-empty list | Ordered diagnostic events. |
| `specimens` | `List[SpecimenSchema]` | List of nodes | Chain-of-custody specimen tree. |

#### `TimelineEventSchema`
| Field | Type | Validation Rules | Description |
|---|---|---|---|
| `id` | `str` | Regex / Unique string | Unique event ID (e.g. `ev-001-1`). |
| `timestamp` | `str` | Valid ISO 8601 string | Event creation timestamp. |
| `event_type` | `EventType` | `imaging \| pathology \| molecular \| clinical_notes` | High-level diagnostic discipline. |
| `subtype` | `str` | Valid modality string | Specific assay/modality (e.g. `ct_chest`, `biopsy`). |
| `evidence_state` | `EvidenceState` | `ordered \| preliminary \| final \| stale \| missing \| superseded` | Current clinical verification status. |
| `freshness_threshold_days`| `int` | `1 <= threshold <= 365` | Modality SLA staleness threshold in days. |
| `visible_roles` | `List[str]` | Subset of authorized roles | Role-based access control list. |

---

## 5. Usage & Validation Commands

### 5.1 Generate & Validate Dataset
To generate fresh test cases with automatic Pydantic validation and schema export:
```bash
python data-generation/generate_test_cases.py
```
Output:
```
Validating generated test cases against BenchmarkDatasetSchema...
Validation successful! 10 cases conform 100% to schema.
Generated and validated 10 clinical benchmark test cases in data-generation/test_cases.json
Exported JSON Schema to data-generation/test_cases.schema.json
```

### 5.2 Standalone Dataset Schema Verification
To validate any dataset file against the schema in CI/CD:
```bash
python data-generation/validate_dataset.py --export-schema
```

### 5.3 Export Standard JSON Schema
The generated JSON Schema is located at [`data-generation/test_cases.schema.json`](file:///c:/Users/sudha/Documents/Multi%20Disciplinary/data-generation/test_cases.schema.json) for integration with external validation tools, automated API gateways, and mock data generators.
