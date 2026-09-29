import json
import os
import sys
import argparse
from datetime import datetime, timezone, timedelta
from schemas import BenchmarkDatasetSchema

def create_test_cases():
    now = datetime.now(timezone.utc)

    test_cases = [
        # Case 001: Urgent (STAT PE scenario - Patient Journey 1)
        {
            "case_id": "001",
            "patient_de_id": "Patient_A_68M",
            "age": 68,
            "sex": "M",
            "primary_dx": "Acute Saddle Pulmonary Embolism with RV Strain",
            "referring_dept": "Emergency Medicine",
            "urgency": "urgent",
            "decision_required_by_hours": 2,
            "complexity": "high",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": False,
            "has_stale_evidence": True,
            "has_missing_evidence": True,
            "expected_decision_time_minutes": 20,
            "baseline_minutes": 45,
            "target_minutes": 8,
            "timeline_events": [
                {
                    "id": "ev-001-1",
                    "timestamp": (now - timedelta(minutes=120)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "ct_chest",
                    "result_date": (now - timedelta(minutes=75)).isoformat(),
                    "received_date": (now - timedelta(minutes=60)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 30,
                    "title": "CT Pulmonary Angiogram (PE Protocol)",
                    "summary": "Extensive saddle embolus extending into main and lobar pulmonary arteries; RV/LV ratio 1.3 consistent with acute strain.",
                    "report_id": "RAD-2024-PE01",
                    "full_report": "TECHNIQUE: Helical CT of thorax following IV non-ionic contrast bolus timed for pulmonary artery opacification.\nFINDINGS: High clot burden saddle embolus occluding bilateral main pulmonary arteries. Right ventricular dilatation present with RV/LV ratio 1.3. No evidence of aortic dissection or pneumothorax.\nIMPRESSION: Massive acute pulmonary embolism with right heart strain.",
                    "visible_roles": ["radiologist", "coordinator", "clinician", "pathologist"]
                },
                {
                    "id": "ev-001-2",
                    "timestamp": (now - timedelta(days=180)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "biopsy",
                    "result_date": (now - timedelta(days=180)).isoformat(),
                    "received_date": (now - timedelta(days=179)).isoformat(),
                    "evidence_state": "stale",
                    "freshness_threshold_days": 90,
                    "title": "Historical Lung Biopsy (Right Lower Lobe)",
                    "summary": "Benign fibrous hamartoma, no atypia or malignancy identified.",
                    "report_id": "PATH-2024-OLD01",
                    "full_report": "SPECIMEN: CT-guided core biopsy right lung base.\nMICROSCOPIC: Sections show benign mature cartilage and fibromyxoid stroma. No evidence of malignancy.\nIMPRESSION: Benign hamartoma.",
                    "visible_roles": ["pathologist", "coordinator", "clinician", "radiologist"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-001-A",
                    "label": "Archival Lung Core Biopsy",
                    "type": "Tissue Core",
                    "parent_id": None,
                    "status": "Archived (Benign)",
                    "collection_date": (now - timedelta(days=180)).isoformat()
                }
            ]
        },

        # Case 002: Routine (Colorectal Staging - Patient Journey 2)
        {
            "case_id": "002",
            "patient_de_id": "Patient_B_54F",
            "age": 54,
            "sex": "F",
            "primary_dx": "Rectal Adenocarcinoma T4b N2 (MSS)",
            "referring_dept": "Colorectal Surgery",
            "urgency": "routine",
            "decision_required_by_hours": 168,
            "complexity": "high",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": True,
            "has_stale_evidence": False,
            "has_missing_evidence": False,
            "expected_decision_time_minutes": 10,
            "baseline_minutes": 35,
            "target_minutes": 7,
            "timeline_events": [
                {
                    "id": "ev-002-1",
                    "timestamp": (now - timedelta(days=7)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "biopsy",
                    "result_date": (now - timedelta(days=5)).isoformat(),
                    "received_date": (now - timedelta(days=5)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 90,
                    "title": "Endoscopic Rectal Biopsy",
                    "summary": "Moderately differentiated invasive adenocarcinoma with lymphovascular permeation.",
                    "report_id": "PATH-2024-RECT01",
                    "full_report": "CLINICAL: Colonoscopy demonstrates ulcerated lesion 6 cm from anal verge.\nHISTOLOGY: Cribriform glands infiltrating muscularis mucosae. Marked cytologic atypia and luminal necrosis.",
                    "visible_roles": ["pathologist", "coordinator", "clinician", "molecular", "radiologist"]
                },
                {
                    "id": "ev-002-2",
                    "timestamp": (now - timedelta(days=4)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "mri_pelvis",
                    "result_date": (now - timedelta(days=3)).isoformat(),
                    "received_date": (now - timedelta(days=3)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 60,
                    "title": "Pelvic MRI Rectal Staging",
                    "summary": "T4b lesion with invasion through anterior peritoneal reflection. 3 mesorectal nodes involved. CRM < 1 mm.",
                    "report_id": "RAD-2024-MR02",
                    "full_report": "MRI RECTAL PROTOCOL: 3.5 cm semi-annular tumor in mid-rectum. Disruption of muscularis propria with peritoneal infiltration. 3 enlarged nodes in mesorectum with irregular borders.",
                    "visible_roles": ["radiologist", "coordinator", "clinician", "pathologist"]
                },
                {
                    "id": "ev-002-3",
                    "timestamp": (now - timedelta(days=2)).isoformat(),
                    "event_type": "molecular",
                    "subtype": "msi_mmr",
                    "result_date": (now - timedelta(days=1)).isoformat(),
                    "received_date": (now - timedelta(days=1)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 21,
                    "title": "MMR Immunohistochemistry Panel",
                    "summary": "Intact nuclear staining for MLH1, MSH2, MSH6, and PMS2. Microsatellite Stable (MSS).",
                    "report_id": "MOL-2024-MMR02",
                    "full_report": "ASSAY: IHC analysis using monoclonal antibodies. All mismatch repair proteins expressed intact. No evidence of Lynch syndrome or hypermutation phenotype.",
                    "visible_roles": ["molecular", "coordinator", "pathologist", "clinician"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-002-A",
                    "label": "Endoscopic Biopsy Rectum",
                    "type": "Endoscopic Mucosal Biopsy",
                    "parent_id": None,
                    "status": "Adequate (Diagnostic)",
                    "collection_date": (now - timedelta(days=7)).isoformat()
                },
                {
                    "id": "SPEC-002-B",
                    "label": "FFPE Block Rectum Reserve",
                    "type": "Formalin-Fixed Paraffin Block",
                    "parent_id": "SPEC-002-A",
                    "status": "Archived for Molecular",
                    "collection_date": (now - timedelta(days=6)).isoformat()
                },
                {
                    "id": "SPEC-002-C",
                    "label": "MMR IHC Slide Set",
                    "type": "Stained Glass Slides",
                    "parent_id": "SPEC-002-B",
                    "status": "Verified (MSS)",
                    "collection_date": (now - timedelta(days=2)).isoformat()
                }
            ]
        },

        # Case 003: Urgent (Failure Mode 1 - External Centre Delay)
        {
            "case_id": "003",
            "patient_de_id": "Patient_C_62M",
            "age": 62,
            "sex": "M",
            "primary_dx": "Suspected Lung Malignancy with External CT Delay",
            "referring_dept": "General Practice / Pulmonology",
            "urgency": "urgent",
            "decision_required_by_hours": 24,
            "complexity": "medium",
            "has_external_imaging": True,
            "has_missing_pathology": True,
            "has_molecular_result": False,
            "has_stale_evidence": False,
            "has_missing_evidence": True,
            "expected_decision_time_minutes": 25,
            "baseline_minutes": 40,
            "target_minutes": 8,
            "timeline_events": [
                {
                    "id": "ev-003-1",
                    "timestamp": (now - timedelta(days=4)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "ct_chest",
                    "result_date": (now - timedelta(days=4)).isoformat(),
                    "received_date": (now - timedelta(hours=2)).isoformat(),
                    "evidence_state": "received",
                    "freshness_threshold_days": 30,
                    "title": "External Centre CT Thorax",
                    "summary": "External scan received after 4-day transfer delay. 3.2 cm RUL lesion with cavitation.",
                    "report_id": "EXT-RAD-003",
                    "full_report": "EXTERNAL TRANSFER: Disk imported into PACS today. Spiculated cavitary mass right upper lobe. Regional lymphadenopathy noted.",
                    "visible_roles": ["radiologist", "coordinator", "clinician"]
                },
                {
                    "id": "ev-003-2",
                    "timestamp": (now - timedelta(days=2)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "bronchoscopy",
                    "result_date": (now - timedelta(days=2)).isoformat(),
                    "received_date": (now - timedelta(days=2)).isoformat(),
                    "evidence_state": "preliminary",
                    "freshness_threshold_days": 90,
                    "title": "Bronchial Washings Cytology",
                    "summary": "Atypical cells suspicious for squamous cell carcinoma; cell block in progress.",
                    "report_id": "PATH-2024-BR03",
                    "full_report": "CYTOLOGY: Cellular specimen showing clusters of keratinizing atypical squamous cells. Confirmatory IHC on cell block pending.",
                    "visible_roles": ["pathologist", "coordinator", "clinician"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-003-A",
                    "label": "Bronchial Washing Liquid",
                    "type": "Cytology Specimen",
                    "parent_id": None,
                    "status": "In Process",
                    "collection_date": (now - timedelta(days=2)).isoformat()
                }
            ]
        },

        # Case 004: Routine (Failure Mode 2 - Molecular Report Supersession)
        {
            "case_id": "004",
            "patient_de_id": "Patient_D_71F",
            "age": 71,
            "sex": "F",
            "primary_dx": "Non-Small Cell Lung Cancer — Superseded NGS Report",
            "referring_dept": "Medical Oncology",
            "urgency": "routine",
            "decision_required_by_hours": 72,
            "complexity": "high",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": True,
            "has_stale_evidence": False,
            "has_missing_evidence": False,
            "expected_decision_time_minutes": 15,
            "baseline_minutes": 38,
            "target_minutes": 9,
            "timeline_events": [
                {
                    "id": "ev-004-1",
                    "timestamp": (now - timedelta(days=10)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "core_biopsy",
                    "result_date": (now - timedelta(days=8)).isoformat(),
                    "received_date": (now - timedelta(days=8)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 90,
                    "title": "CT-guided Lung Core Biopsy",
                    "summary": "Invasive pulmonary adenocarcinoma, TTF-1 positive, PD-L1 TPS 45%.",
                    "report_id": "PATH-2024-LC04",
                    "full_report": "HISTOPATHOLOGY: Moderately differentiated lung adenocarcinoma with acinar pattern.",
                    "visible_roles": ["pathologist", "coordinator", "clinician", "molecular", "radiologist"]
                },
                {
                    "id": "ev-004-2",
                    "timestamp": (now - timedelta(days=5)).isoformat(),
                    "event_type": "molecular",
                    "subtype": "ngs",
                    "result_date": (now - timedelta(days=5)).isoformat(),
                    "received_date": (now - timedelta(days=5)).isoformat(),
                    "evidence_state": "superseded",
                    "freshness_threshold_days": 21,
                    "title": "Preliminary NGS Panel (Superseded)",
                    "summary": "Preliminary run flagged EGFR Exon 19 deletion; superseded due to baseline calibration re-check.",
                    "report_id": "MOL-2024-PRE04",
                    "full_report": "PRELIMINARY ASSAY: Initial sequencing suggested low variant allele frequency EGFR Exon 19 del. Re-extraction performed.",
                    "visible_roles": ["molecular", "coordinator", "clinician"]
                },
                {
                    "id": "ev-004-3",
                    "timestamp": (now - timedelta(days=1)).isoformat(),
                    "event_type": "molecular",
                    "subtype": "ngs",
                    "result_date": (now - timedelta(days=1)).isoformat(),
                    "received_date": (now - timedelta(days=1)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 21,
                    "title": "Corrected Final NGS Molecular Panel",
                    "summary": "EGFR Wild Type. KRAS G12C mutation identified (VAF 32%). ALK and ROS1 negative.",
                    "report_id": "MOL-2024-FINAL04",
                    "full_report": "FINAL VALIDATED NGS: Re-sequencing confirms absence of EGFR alterations. Pathogenic KRAS c.34G>T (p.Gly12Cys) identified.",
                    "visible_roles": ["molecular", "coordinator", "clinician", "pathologist"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-004-A",
                    "label": "Percutaneous Lung Core Biopsy",
                    "type": "Core Biopsy",
                    "parent_id": None,
                    "status": "Adequate",
                    "collection_date": (now - timedelta(days=10)).isoformat()
                },
                {
                    "id": "SPEC-004-B",
                    "label": "Reserve DNA Extract",
                    "type": "Purified DNA",
                    "parent_id": "SPEC-004-A",
                    "status": "Validated (KRAS G12C)",
                    "collection_date": (now - timedelta(days=2)).isoformat()
                }
            ]
        },

        # Case 005: Urgent (Failure Mode 3 - Stale Imaging in Acute Setting)
        {
            "case_id": "005",
            "patient_de_id": "Patient_E_59M",
            "age": 59,
            "sex": "M",
            "primary_dx": "Acute Abdominal Pain with 90-day Stale MRI",
            "referring_dept": "Acute Surgical Assessment Unit",
            "urgency": "urgent",
            "decision_required_by_hours": 4,
            "complexity": "medium",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": False,
            "has_stale_evidence": True,
            "has_missing_evidence": True,
            "expected_decision_time_minutes": 15,
            "baseline_minutes": 32,
            "target_minutes": 6,
            "timeline_events": [
                {
                    "id": "ev-005-1",
                    "timestamp": (now - timedelta(days=90)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "mri_abdomen",
                    "result_date": (now - timedelta(days=90)).isoformat(),
                    "received_date": (now - timedelta(days=90)).isoformat(),
                    "evidence_state": "stale",
                    "freshness_threshold_days": 60,
                    "title": "Historical Liver MRI (90 days old)",
                    "summary": "Stale imaging: 2.1 cm segment IVa hemangioma; no acute inflammatory change recorded 3 months ago.",
                    "report_id": "RAD-2024-OLD05",
                    "full_report": "MR LIVER WITH EOVIST: Stable benign vascular lesion segment IVa. No biliary duct dilatation.",
                    "visible_roles": ["radiologist", "coordinator", "clinician"]
                },
                {
                    "id": "ev-005-2",
                    "timestamp": (now - timedelta(hours=3)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "ultrasound",
                    "result_date": (now - timedelta(hours=1)).isoformat(),
                    "received_date": (now - timedelta(hours=1)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 3,
                    "title": "Bedside RUQ Ultrasound",
                    "summary": "Gallbladder wall thickening 5 mm, pericholecystic fluid, positive sonographic Murphy sign.",
                    "report_id": "RAD-2024-US05",
                    "full_report": "ULTRASOUND RUQ: Distended gallbladder with impacted calculus in neck. Features diagnostic of acute calculus cholecystitis.",
                    "visible_roles": ["radiologist", "clinician", "coordinator"]
                }
            ],
            "specimens": []
        },

        # Cases 006 - 010: Additional Routine & Specialized Oncology Scenarios
        {
            "case_id": "006",
            "patient_de_id": "Patient_F_49F",
            "age": 49,
            "sex": "F",
            "primary_dx": "Infiltrating Ductal Carcinoma Breast (HER2+)",
            "referring_dept": "Breast Care Unit",
            "urgency": "routine",
            "decision_required_by_hours": 120,
            "complexity": "high",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": True,
            "has_stale_evidence": False,
            "has_missing_evidence": False,
            "expected_decision_time_minutes": 10,
            "baseline_minutes": 30,
            "target_minutes": 7,
            "timeline_events": [
                {
                    "id": "ev-006-1",
                    "timestamp": (now - timedelta(days=12)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "mammogram",
                    "result_date": (now - timedelta(days=12)).isoformat(),
                    "received_date": (now - timedelta(days=12)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 30,
                    "title": "Digital Bilateral Mammogram",
                    "summary": "BI-RADS 5 irregular spiculated mass upper outer quadrant left breast 2.4 cm.",
                    "report_id": "RAD-2024-MAM06",
                    "full_report": "High suspicion malignancy BI-RADS 5 left breast.",
                    "visible_roles": ["radiologist", "coordinator", "clinician", "pathologist"]
                },
                {
                    "id": "ev-006-2",
                    "timestamp": (now - timedelta(days=6)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "core_biopsy",
                    "result_date": (now - timedelta(days=5)).isoformat(),
                    "received_date": (now - timedelta(days=5)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 90,
                    "title": "Left Breast Core Biopsy",
                    "summary": "Invasive ductal carcinoma, Grade 3. ER negative, PR negative, HER2 3+ (Overexpressed).",
                    "report_id": "PATH-2024-BR06",
                    "full_report": "High grade IDC. Reflex IHC confirms strong 3+ circumferential membrane staining in >10% tumor cells.",
                    "visible_roles": ["pathologist", "coordinator", "clinician", "molecular", "radiologist"]
                },
                {
                    "id": "ev-006-3",
                    "timestamp": (now - timedelta(days=4)).isoformat(),
                    "event_type": "molecular",
                    "subtype": "her2_fish",
                    "result_date": (now - timedelta(days=2)).isoformat(),
                    "received_date": (now - timedelta(days=2)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 60,
                    "title": "HER2/neu Dual-Color FISH Assay",
                    "summary": "HER2/CEP17 copy number ratio 4.2 with mean 9.6 HER2 signals/cell. Confirms ERBB2 gene amplification.",
                    "report_id": "MOL-2024-HER06",
                    "full_report": "Fluorescence in situ hybridization (FISH) demonstrates high-level ERBB2 (HER2) oncogene amplification.",
                    "visible_roles": ["molecular", "pathologist", "clinician", "coordinator"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-006-A",
                    "label": "Left Breast Ultrasound Core",
                    "type": "Core Needle Biopsy",
                    "parent_id": None,
                    "status": "Adequate",
                    "collection_date": (now - timedelta(days=6)).isoformat()
                }
            ]
        },

        {
            "case_id": "007",
            "patient_de_id": "Patient_G_65M",
            "age": 65,
            "sex": "M",
            "primary_dx": "Prostate Adenocarcinoma Gleason 4+5=9",
            "referring_dept": "Urology",
            "urgency": "routine",
            "decision_required_by_hours": 168,
            "complexity": "medium",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": False,
            "has_stale_evidence": False,
            "has_missing_evidence": False,
            "expected_decision_time_minutes": 8,
            "baseline_minutes": 28,
            "target_minutes": 6,
            "timeline_events": [
                {
                    "id": "ev-007-1",
                    "timestamp": (now - timedelta(days=14)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "mri_prostate",
                    "result_date": (now - timedelta(days=13)).isoformat(),
                    "received_date": (now - timedelta(days=13)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 60,
                    "title": "Multiparametric Prostate MRI",
                    "summary": "PI-RADS 5 lesion in peripheral zone with capsular abutment and probable ECE.",
                    "report_id": "RAD-2024-PR07",
                    "full_report": "mpMRI demonstrates 18 mm restricted diffusion target in right mid-peripheral zone.",
                    "visible_roles": ["radiologist", "coordinator", "clinician", "pathologist"]
                },
                {
                    "id": "ev-007-2",
                    "timestamp": (now - timedelta(days=7)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "prostate_biopsy",
                    "result_date": (now - timedelta(days=5)).isoformat(),
                    "received_date": (now - timedelta(days=5)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 90,
                    "title": "Targeted MRI-US Fusion Biopsy",
                    "summary": "Adenocarcinoma, Gleason Grade Group 5 (4+5=9). 8 of 12 cores positive.",
                    "report_id": "PATH-2024-PR07",
                    "full_report": "High risk prostate adenocarcinoma with cribriform morphology.",
                    "visible_roles": ["pathologist", "coordinator", "clinician", "radiologist"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-007-A",
                    "label": "Fusion Prostate Biopsy Cores",
                    "type": "Needle Biopsies",
                    "parent_id": None,
                    "status": "Diagnostic",
                    "collection_date": (now - timedelta(days=7)).isoformat()
                }
            ]
        },

        {
            "case_id": "008",
            "patient_de_id": "Patient_H_52M",
            "age": 52,
            "sex": "M",
            "primary_dx": "Oropharyngeal SCC (p16 Positive)",
            "referring_dept": "Head & Neck Surgery",
            "urgency": "routine",
            "decision_required_by_hours": 96,
            "complexity": "high",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": True,
            "has_stale_evidence": False,
            "has_missing_evidence": False,
            "expected_decision_time_minutes": 12,
            "baseline_minutes": 35,
            "target_minutes": 8,
            "timeline_events": [
                {
                    "id": "ev-008-1",
                    "timestamp": (now - timedelta(days=10)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "tonsil_biopsy",
                    "result_date": (now - timedelta(days=8)).isoformat(),
                    "received_date": (now - timedelta(days=8)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 90,
                    "title": "Left Tonsil Excisional Biopsy",
                    "summary": "Non-keratinizing squamous cell carcinoma; diffuse strong p16 positivity (HPV-mediated).",
                    "report_id": "PATH-2024-HN08",
                    "full_report": "Sections show infiltration by syncytial sheets of malignant cells with high N:C ratio.",
                    "visible_roles": ["pathologist", "coordinator", "clinician", "molecular", "radiologist"]
                },
                {
                    "id": "ev-008-2",
                    "timestamp": (now - timedelta(days=5)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "pet_ct",
                    "result_date": (now - timedelta(days=4)).isoformat(),
                    "received_date": (now - timedelta(days=4)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 30,
                    "title": "FDG PET/CT Whole Body Staging",
                    "summary": "Intense FDG avidity left palatine tonsil (SUVmax 11.2) and ipsilateral Level IIa node (SUVmax 7.8). No distant metastasis.",
                    "report_id": "RAD-2024-PET08",
                    "full_report": "Stage cT2 N1 M0 HPV-positive oropharyngeal carcinoma.",
                    "visible_roles": ["radiologist", "coordinator", "clinician", "pathologist"]
                },
                {
                    "id": "ev-008-3",
                    "timestamp": (now - timedelta(days=3)).isoformat(),
                    "event_type": "molecular",
                    "subtype": "hpv_pcr",
                    "result_date": (now - timedelta(days=1)).isoformat(),
                    "received_date": (now - timedelta(days=1)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 30,
                    "title": "High-Risk HPV Real-Time PCR (Genotype 16)",
                    "summary": "HPV Type 16 DNA detected at high copy number (>10^6 copies/ug DNA). Correlates with p16 IHC expression.",
                    "report_id": "MOL-2024-HPV08",
                    "full_report": "Targeted real-time PCR confirms presence of transcriptionally active high-risk HPV16 oncogenic lineage.",
                    "visible_roles": ["molecular", "pathologist", "clinician", "coordinator"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-008-A",
                    "label": "Left Tonsil Resection",
                    "type": "Excision Biopsy",
                    "parent_id": None,
                    "status": "Confirmed p16+",
                    "collection_date": (now - timedelta(days=10)).isoformat()
                }
            ]
        },

        {
            "case_id": "009",
            "patient_de_id": "Patient_I_43F",
            "age": 43,
            "sex": "F",
            "primary_dx": "High-Grade Serous Ovarian Carcinoma",
            "referring_dept": "Gynaecological Oncology",
            "urgency": "routine",
            "decision_required_by_hours": 120,
            "complexity": "high",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": True,
            "has_stale_evidence": False,
            "has_missing_evidence": False,
            "expected_decision_time_minutes": 10,
            "baseline_minutes": 32,
            "target_minutes": 7,
            "timeline_events": [
                {
                    "id": "ev-009-1",
                    "timestamp": (now - timedelta(days=15)).isoformat(),
                    "event_type": "imaging",
                    "subtype": "ct_pelvis",
                    "result_date": (now - timedelta(days=14)).isoformat(),
                    "received_date": (now - timedelta(days=14)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 30,
                    "title": "CT Abdomen and Pelvis with Contrast",
                    "summary": "Bilateral complex cystic-solid adnexal masses with omental caking and moderate ascites.",
                    "report_id": "RAD-2024-CT09",
                    "full_report": "Imaging features typical of advanced peritoneal carcinomatosis of ovarian origin.",
                    "visible_roles": ["radiologist", "coordinator", "clinician", "pathologist"]
                },
                {
                    "id": "ev-009-2",
                    "timestamp": (now - timedelta(days=8)).isoformat(),
                    "event_type": "molecular",
                    "subtype": "germline_brca",
                    "result_date": (now - timedelta(days=4)).isoformat(),
                    "received_date": (now - timedelta(days=4)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 60,
                    "title": "Germline BRCA1/2 Panel",
                    "summary": "Pathogenic BRCA1 frameshift mutation detected (c.5266dupC). PARP inhibitor candidate.",
                    "report_id": "MOL-2024-BRCA09",
                    "full_report": "Targeted next-generation sequencing identifies known pathogenic Ashkenazi founder variant.",
                    "visible_roles": ["molecular", "coordinator", "clinician", "pathologist"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-009-A",
                    "label": "Paracentesis Ascitic Fluid",
                    "type": "Body Fluid Cytology",
                    "parent_id": None,
                    "status": "Diagnostic",
                    "collection_date": (now - timedelta(days=11)).isoformat()
                }
            ]
        },

        {
            "case_id": "010",
            "patient_de_id": "Patient_J_77M",
            "age": 77,
            "sex": "M",
            "primary_dx": "Melanoma BRAF V600E Mutant with In-Transit Metastases",
            "referring_dept": "Dermatology / Surgical Oncology",
            "urgency": "routine",
            "decision_required_by_hours": 168,
            "complexity": "medium",
            "has_external_imaging": False,
            "has_missing_pathology": False,
            "has_molecular_result": True,
            "has_stale_evidence": False,
            "has_missing_evidence": False,
            "expected_decision_time_minutes": 8,
            "baseline_minutes": 25,
            "target_minutes": 6,
            "timeline_events": [
                {
                    "id": "ev-010-1",
                    "timestamp": (now - timedelta(days=16)).isoformat(),
                    "event_type": "pathology",
                    "subtype": "skin_excision",
                    "result_date": (now - timedelta(days=14)).isoformat(),
                    "received_date": (now - timedelta(days=14)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 90,
                    "title": "Wide Local Excision Left Calf",
                    "summary": "Nodular malignant melanoma, Breslow thickness 3.8 mm, Clark Level IV, ulcerated. Margins clear.",
                    "report_id": "PATH-2024-MEL10",
                    "full_report": "High risk cutaneous melanoma with brisk tumor-infiltrating lymphocytes.",
                    "visible_roles": ["pathologist", "coordinator", "clinician", "molecular", "radiologist"]
                },
                {
                    "id": "ev-010-2",
                    "timestamp": (now - timedelta(days=6)).isoformat(),
                    "event_type": "molecular",
                    "subtype": "braf_pcr",
                    "result_date": (now - timedelta(days=3)).isoformat(),
                    "received_date": (now - timedelta(days=3)).isoformat(),
                    "evidence_state": "final",
                    "freshness_threshold_days": 21,
                    "title": "BRAF V600 Mutation Real-Time PCR",
                    "summary": "BRAF c.1799T>A (p.Val600Glu / V600E) mutation positive. Eligible for targeted BRAF+MEK inhibitors.",
                    "report_id": "MOL-2024-BRAF10",
                    "full_report": "Allele-specific PCR amplification confirms presence of V600E codon variant.",
                    "visible_roles": ["molecular", "coordinator", "clinician", "pathologist"]
                }
            ],
            "specimens": [
                {
                    "id": "SPEC-010-A",
                    "label": "Wide Excision Left Calf Skin",
                    "type": "Surgical Specimen",
                    "parent_id": None,
                    "status": "Diagnostic",
                    "collection_date": (now - timedelta(days=16)).isoformat()
                }
            ]
        }
    ]

    # Schema validation before saving
    print("Validating generated test cases against BenchmarkDatasetSchema...")
    validated_dataset = BenchmarkDatasetSchema(cases=test_cases)
    print(f"Validation successful! {len(validated_dataset.cases)} cases conform 100% to schema.")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(script_dir, "test_cases.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(test_cases, f, indent=2)
    print(f"Generated and validated {len(test_cases)} clinical benchmark test cases in {out_path}")

    # Export schema
    schema_path = os.path.join(script_dir, "test_cases.schema.json")
    with open(schema_path, "w", encoding="utf-8") as sf:
        json.dump(BenchmarkDatasetSchema.model_json_schema(), sf, indent=2)
    print(f"Exported JSON Schema to {schema_path}")

if __name__ == "__main__":
    create_test_cases()

