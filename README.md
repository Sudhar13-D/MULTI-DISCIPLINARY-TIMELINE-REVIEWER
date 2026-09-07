# Clinical MDT Evidence Timeline System
## Complete Full-Stack Clinical Decision Platform (`MDT/`)

A production-grade web application for multidisciplinary team (MDT) case review, longitudinal evidence assembly, specimen lineage tracking, and binding decision recording in oncology and acute care contexts.

---

## 📁 Repository Structure

```
MDT/
├── backend/                       # Python FastAPI REST backend
│   ├── main.py                    # API router (Auth, Cases, Timeline, Decisions, Uploads)
│   ├── database.py                # SQLite WAL database connection & schema
│   ├── models.py                  # Pydantic schemas & Freshness state engine
│   ├── auth.py                    # PBKDF2 hashing, bearer sessions, and RBAC guards
│   ├── seed_data.py               # Pre-seeded clinical users, cases, and specimens
│   ├── test_backend.py            # Automated backend test suite (100% pass)
│   ├── run.py                     # Uvicorn runner script
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variables template
│   └── clinical_mdt.db            # Persistent SQLite database
│
├── src/                           # React 19 + TypeScript + Tailwind v4 Frontend
│   ├── components/
│   │   ├── auth/                  # LoginModal with clinical persona quick-switcher
│   │   ├── decision/              # DecisionFormWithEvidenceCheckboxes (binding sign-off)
│   │   ├── evidence/              # FreshnessIndicator & EvidenceDrillDownModal
│   │   ├── dashboard/             # CaseFreshnessOverview (status distribution)
│   │   ├── specimen/              # SpecimenTreeView (interactive hierarchical tree)
│   │   ├── audit/                 # AuditLogDrawer (live governance & 403 logs)
│   │   ├── upload/                # DocumentUploadModal (file validation & attachments)
│   │   ├── layout/                # Header, StatusBar, ResizeHandle (adjustable panels)
│   │   ├── sidebar/               # PatientSidebar (demographics, specimen tabs)
│   │   ├── timeline/              # UnifiedTimelineView (chronological sequence)
│   │   └── common/                # SVG medical icons and controls
│   ├── context/                   # AuthContext (real server-side identity)
│   ├── services/                  # api.ts (typed HTTP client)
│   ├── types/                     # TypeScript domain models
│   ├── App.tsx                    # Root dashboard application
│   ├── main.tsx                   # Vite React entrypoint
│   └── index.css                  # Tailwind v4 & typography/cursor rules
│
├── docs/                          # Capstone Project Documentation
│   ├── process_comparison.md      # As-Is vs To-Be Field-Workflow Comparison
│   ├── patient_journeys.md        # Patient Journey 1 (Urgent PE) & 2 (Routine Staging)
│   ├── failure_modes.md           # Failure Mode Validation (3 Clinical Edge Cases)
│   ├── stakeholder_feedback.md    # Clinical Stakeholder Evaluation & Interviews
│   └── technical_documentation.md # Architecture, ERD Schema, and API Contracts
│
├── data-generation/               # Clinical Test Case Generator
│   ├── generate_test_cases.py     # Generator script for 10 benchmark cases
│   └── test_cases.json            # Generated dataset
│
├── experiment/                    # Benchmark Experimentation Suite
│   ├── benchmark_runner.py        # Executable benchmark comparing Manual vs Auto
│   └── timeline_assembly_benchmark.ipynb # Jupyter notebook with statistics & charts
│
├── presentation/                  # Presentation & Demonstration Deck
│   └── clinical_mdt_timeline.md   # 10-slide presentation deck & demo script
│
├── index.html                     # Web entrypoint
├── package.json                   # Dependencies & scripts
├── package-lock.json              # Lockfile
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Standalone Vite 8 config with backend proxy
└── .gitignore                     # Git rules (ignores node_modules & dist)
```

---

## 🚀 How to Run the Platform

### 1. Launch the FastAPI Backend
Open a terminal inside the `MDT` directory:
```bash
cd backend
python run.py
```
*Backend runs on `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`).*

### 2. Launch the Web Frontend
In another terminal inside the `MDT` directory:
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173` (proxies `/api` and `/uploads` to port 8000).*

---

## 🧪 Automated Testing & Experiments

### Run Backend Verification Tests
```bash
python backend/test_backend.py
```
*Tests PBKDF2 authentication, 403 Forbidden security rejection for Radiologists, authorized decision submission by Chair, audit logging, and PACS/LIMS healthchecks.*

### Run Case Assembly Benchmark Experiment
```bash
python experiment/benchmark_runner.py
```
*Demonstrates a **76.6% reduction in case assembly time** (28.2 min down to 6.6 min) and **100% elimination** of unflagged stale/missing evidence errors across 10 clinical cases.*

---

## 🔑 Pre-Configured Clinical Personas (For Testing RBAC)

| Persona | Role | Password | RBAC Permission |
|---|---|---|---|
| **Prof. E. Adams, MD** | `CHAIR` | `HospitalSecure2024!` | **Authorized** for binding decisions |
| **Sarah Jenkins, RN** | `COORDINATOR` | `HospitalSecure2024!` | **Authorized** for scheduling & decisions |
| **Dr. S. Chen, FRCR** | `RADIOLOGIST` | `HospitalSecure2024!` | **Read-only** (Submitting decision returns **HTTP 403**) |
| **Dr. M. Okafor, FRCPath** | `PATHOLOGIST` | `HospitalSecure2024!` | **Read-only** (Returns **HTTP 403**) |
| **Dr. L. Farooqi, PhD** | `MOLECULAR` | `HospitalSecure2024!` | **Read-only** (Returns **HTTP 403**) |
| **Dr. R. Nair, FRCP** | `CLINICIAN` | `HospitalSecure2024!` | **Read-only** (Returns **HTTP 403**) |

---

## 🌿 How to Push the `MDT` Folder to Git

```bash
cd "c:\Users\sudha\Downloads\Radiology Evidence Timeline Interface\MDT"

# Initialize git repository
git init

# Stage all files (node_modules is excluded by .gitignore)
git add .

# Commit
git commit -m "feat: Clinical MDT Evidence Timeline System complete full-stack platform"

# Connect to your GitHub / GitLab repository
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git branch -M main
git push -u origin main
```
