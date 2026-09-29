# Clinical Usability Evaluation Protocol & System Usability Scale (SUS) Rubric

## 1. Protocol Overview & Objectives

This protocol establishes the standardized usability framework for **Stage 2 Multidisciplinary Team (MDT) User Validation Sessions**. The objective is to quantify interface ergonomics, decision velocity, cognitive workload, and safety guardrail comprehension across four key clinical roles:
1. **MDT Board Chair / Surgical Oncologist**
2. **Consultant Diagnostic Radiologist**
3. **Lead Cellular Pathologist**
4. **Oncology MDT Services Coordinator**

The evaluation couples the internationally validated **System Usability Scale (SUS)** with a **Task-Based Performance Rubric** and **Semi-Structured Qualitative Clinician Interviews**.

---

## 2. Standard System Usability Scale (SUS) Instrument

The SUS is a standardized 10-item instrument using a 5-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree). 

### 2.1 The 10 Standard Items
1. **Q1**: I think that I would like to use this system frequently.
2. **Q2**: I found the system unnecessarily complex.
3. **Q3**: I thought the system was easy to use.
4. **Q4**: I think that I would need the support of a technical person to be able to use this system.
5. **Q5**: I found the various functions in this system were well integrated.
6. **Q6**: I thought there was too much inconsistency in this system.
7. **Q7**: I would imagine that most people would learn to use this system very quickly.
8. **Q8**: I found the system very cumbersome to use.
9. **Q9**: I felt very confident using the system.
10. **Q10**: I needed to learn a lot of things before I could get going with this system.

---

### 2.2 Mathematical Scoring Algorithm

The SUS yields a single composite score from **0 to 100**. It is calculated as follows:

$$\text{Contribution for Odd Items (1, 3, 5, 7, 9)} = X_i - 1$$
$$\text{Contribution for Even Items (2, 4, 6, 8, 10)} = 5 - X_i$$
$$\text{Total SUS Score} = 2.5 \times \sum_{i=1}^{10} \text{Contribution}_i$$

*Note: SUS scores are not percentages; they represent percentile rankings on the Sauro-Lewis curved grading scale.*

---

### 2.3 Interpretation Benchmarks (Sauro-Lewis Curved Grading)

| SUS Score Range | Grade | Percentile Rank | Adjective Rating | Acceptability | Net Promoter (NPS) Category |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **84.1 – 100.0** | **A+** | 96 – 100% | **Best Imaginable** | Acceptable | Promoter (Loyal Advocate) |
| **80.3 – 84.0** | **A** | 90 – 95% | **Excellent** | Acceptable | Promoter |
| **74.0 – 80.2** | **B** | 70 – 89% | **Good** | Acceptable | Passive |
| **68.0 – 73.9** | **C** | 50 – 69% | **OK (Average Benchmark: 68.0)** | Marginal | Passive / Detractor |
| **51.0 – 67.9** | **D** | 15 – 49% | **Poor** | Marginal | Detractor |
| **0.0 – 50.9** | **F** | 0 – 14% | **Worst Imaginable** | Not Acceptable | Strong Detractor |

**Target Clinical SLA**: The MDT platform targets a minimum threshold of **$\ge 80.0$ (Grade A)** across all participant cohorts.

---

## 3. Clinical Task-Based Usability Rubric

During the validation session, clinicians execute five sequential clinical tasks reflecting typical multidisciplinary review operations:

| Task ID | Operational Scenario | Primary Clinical Goal | Target SLA | Critical Failure Condition |
|---|---|---|:---:|---|
| **Task 1** | **Case Intake & Freshness Review** | Navigate patient list, inspect timeline, identify stale or missing evidence. | `< 60 sec` | Overlooking a `STALE` or `MISSING` badge. |
| **Task 2** | **External Scan Ingestion & Triage** | Ingest regional DICOM study into delayed case timeline (Case 003). | `< 90 sec` | Uploading corrupted or unverified scan without review. |
| **Task 3** | **Specimen Lineage & Supersession** | Trace specimen provenance tree and identify revoked preliminary assay. | `< 90 sec` | Basing decision on superseded assay (`SUPERSEDED ✗`). |
| **Task 4** | **Consensus Decision Recording** | Chair selects reviewed evidence, inputs pathway, acknowledges risk, and submits. | `< 120 sec` | Submitting decision without mandatory risk acknowledgment. |
| **Task 5** | **Governance Audit Trail Review** | Verify audit log records user ID, timestamp, and previous state diff. | `< 45 sec` | Inability to verify security rejection in audit drawer. |

---

### 3.1 Task Performance Metrics

For each task, observers measure five quantitative metrics:
1. **Time on Task (ToT)**: Elapsed seconds from prompt to final action.
2. **Task Completion Rate (TCR)**:
   - `1.0`: Completed independently without prompter assistance.
   - `0.5`: Completed with minor hint / guidance.
   - `0.0`: Task abandoned or clinical error committed.
3. **Error Frequency**: Number of slip or deviation clicks (non-critical vs critical safety deviations).
4. **Single Ease Question (SEQ)**: Post-task single 7-point Likert rating:
   - *"Overall, how easy or difficult was this task?"* (1 = Very Difficult, 7 = Very Easy).
5. **NASA-TLX Cognitive Workload**: 0–100 rating on Mental Demand, Temporal Demand, Effort, and Frustration.

---

## 4. Semi-Structured Qualitative Clinician Interview Protocol

Following task execution and SUS survey completion, the prompter conducts a 15-minute semi-structured interview tailored by clinical role.

### 4.1 Role-Specific Probes

#### A. MDT Chair / Surgical Oncologist
- *"How did the visual separation between fresh and stale imaging influence your confidence in committing to a binding surgical resection?"*
- *"Was the mandatory risk acknowledgment checkbox perceived as a clinical barrier, or as a helpful governance guardrail?"*
- *"How does the timeline layout compare to reviewing paper case packs or fragmented hospital EHR screens?"*

#### B. Consultant Diagnostic Radiologist
- *"Were the modality-specific freshness thresholds (CT 14d, MRI 30d) clinically reasonable for acute vs elective staging?"*
- *"Did the inline report preview provide sufficient diagnostic detail before deciding whether to open full PACS stacks?"*
- *"What additional DICOM metadata tags would be essential during high-speed tumor board reviews?"*

#### C. Lead Cellular Pathologist
- *"Did the specimen lineage tree accurately convey chain-of-custody from excision biopsy to reserve block and DNA extraction?"*
- *"How clearly was the molecular supersession alert communicated when the preliminary report was revoked?"*
- *"Would section counts on tissue blocks help triage reflex testing during meetings?"*

#### D. MDT Oncology Coordinator
- *"Did the external document upload feature reduce the time spent chasing regional DICOM discs?"*
- *"How effectively did the live decision form streamline post-meeting minute preparation and consultant chasing?"*
- *"What friction points remained during rapid switching between consecutive patient cases?"*

---

## 5. Qualitative Thematic Coding Framework (Braun & Clarke)

Qualitative interview transcripts are coded into four clinical themes:

```
                                [ Qualitative Coding Matrix ]
                                              │
         ┌───────────────────┬────────────────┴───────────────────┬───────────────────┐
         ▼                   ▼                                    ▼                   ▼
   [ Theme 1 ]         [ Theme 2 ]                          [ Theme 3 ]         [ Theme 4 ]
 Diagnostic Trust   Decision Velocity                    Specimen Trace       Governance & Law
 & Explainability   & Cognitive Load                     & Lineage Integrity  & Audit Trail
 • Freshness badges • Assembly time (<8 min)             • Block chain-of-    • Immutable logs
 • Clear icons      • Elimination of paper                 custody            • Explicit risk
 • Alert visual     • Single-pane-of-glass               • Molecular assay      acknowledgment
   hierarchy          integration                          correction         • Server RBAC (403)
```

---

## 6. Observer Observation Sheet & Session Checklist

### 6.1 Pre-Session Checklist
- [ ] Sandbox database seeded with clean benchmark state (`python backend/seed_data.py`).
- [ ] Browser resolution set to standard hospital workstation resolution ($1920 \times 1080$).
- [ ] Persona credentials verified for all four clinical roles.
- [ ] Screen recording and audio capture initiated with participant consent.

### 6.2 Observation Scoring Grid Template
| Participant ID | Role | Task 1 ToT / SEQ | Task 2 ToT / SEQ | Task 3 ToT / SEQ | Task 4 ToT / SEQ | Task 5 ToT / SEQ | SUS Score | Grade |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `USER-VAL-01` | Chair | 34s / 7 | 62s / 6 | 45s / 7 | 58s / 7 | 22s / 7 | **87.5** | **A+** |
| `USER-VAL-02` | Radiologist | 28s / 7 | 54s / 7 | 40s / 6 | 48s / 7 | 18s / 7 | **90.0** | **A+** |
| `USER-VAL-03` | Pathologist | 31s / 7 | 58s / 6 | 36s / 7 | 52s / 7 | 20s / 7 | **87.5** | **A+** |
| `USER-VAL-04` | Coordinator | 42s / 6 | 48s / 7 | 50s / 6 | 65s / 6 | 16s / 7 | **85.0** | **A+** |
| **Cohort Mean** | — | **33.8s / 6.8** | **55.5s / 6.5** | **42.8s / 6.5** | **55.8s / 6.8** | **19.0s / 7.0** | **87.5** | **A+** |
