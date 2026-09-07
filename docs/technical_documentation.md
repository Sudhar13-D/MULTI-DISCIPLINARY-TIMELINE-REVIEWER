# Clinical MDT Evidence Timeline System: Technical Documentation

## 1. System Architecture Diagram

```
+-------------------------------------------------------------------------+
|                    Clinical Browser Client (React 19)                    |
|                                                                         |
|  +-------------------+  +--------------------+  +--------------------+  |
|  | Auth Context      |  | Resizable Panels   |  | Interactive        |  |
|  | (RBAC Identity)   |  | (Left, Center, R)  |  | Decision Form      |  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  | Freshness Badges  |  | Specimen Tree      |  | Audit Trail Drawer |  |
|  | & Staleness Engine|  | (Lineage Graph)    |  | & Document Upload  |  |
|  +-------------------+  +--------------------+  +--------------------+  |
+------------------------------------+------------------------------------+
                                     | JSON / Multipart HTTP (Vite Proxy)
+------------------------------------v------------------------------------+
|                FastAPI Clinical Services (Python 3.13)                  |
|                                                                         |
|  +-------------------+  +--------------------+  +--------------------+  |
|  | /api/auth/*       |  | /api/cases/*       |  | /api/decisions     |  |
|  | (PBKDF2 Sessions) |  | (Timeline & Cases) |  | (RBAC Guarded)     |  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  +-------------------+  +--------------------+  +--------------------+  |
|  | /api/evidence/*   |  | /api/specimens/*   |  | /api/system/*      |  |
|  | (Reports & DICOM) |  | (Lineage Tree)     |  | (PACS/LIMS Health) |  |
|  +-------------------+  +--------------------+  +--------------------+  |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                  SQLite Clinical Database Engine (WAL)                  |
|   users · sessions · cases · timeline_events · specimens · decisions    |
|   audit_logs · documents · notifications                                |
+-------------------------------------------------------------------------+
```

---

## 2. Database Entity-Relationship Diagram (ERD Schema)

```
       +-----------------------+              +-----------------------+
       |         users         | 1          * |       sessions        |
       +-----------------------+--------------+-----------------------+
       | PK  id                |              | PK  token             |
       |     email (UNIQUE)    |              | FK  user_id           |
       |     password_hash     |              |     created_at        |
       |     salt              |              |     expires_at        |
       |     full_name         |              +-----------------------+
       |     role              |
       |     department        |
       |     created_at        |
       +-----------+-----------+
                   | 1
                   |
                   | * (submitted_by)
       +-----------v-----------+              +-----------------------+
       |       decisions       | *          1 |         cases         |
       +-----------------------+--------------+-----------------------+
       | PK  id                |              | PK  id                |
       | FK  case_id           |              |     patient_de_id     |
       | FK  submitted_by      |              |     age, sex          |
       |     decision_text     |              |     primary_dx        |
       |     treatment_pathway |              |     referring_dept    |
       |     consensus_level   |              |     urgency           |
       |     contingencies     |              |     decision_hours    |
       |     evidence_reviewed |              |     complexity        |
       |     stale_risk_ack    |              |     baseline_minutes  |
       |     created_at        |              |     target_minutes    |
       +-----------------------+              |     status            |
                                              |     created_at        |
                                              +-----------+-----------+
                                                          | 1
                            +-----------------------------+-----------------------------+
                            | *                                                         | *
                +-----------v-----------+                                   +-----------v-----------+
                |    timeline_events    |                                   |       specimens       |
                +-----------------------+                                   +-----------------------+
                | PK  id                |                                   | PK  id                |
                | FK  case_id           |                                   | FK  case_id           |
                |     timestamp         |                                   | FK  parent_id (Tree)  |
                |     event_type        |                                   |     label, type       |
                |     subtype           |                                   |     status            |
                | FK  specimen_id       |                                   |     collection_date   |
                |     result_date       |                                   +-----------------------+
                |     received_date     |
                |     evidence_state    |
                |     freshness_thresh  |
                |     title, summary    |
                |     full_report       |
                |     visible_roles     |
                +-----------------------+

       +-----------------------+              +-----------------------+
       |      audit_logs       |              |       documents       |
       +-----------------------+              +-----------------------+
       | PK  id                |              | PK  id                |
       | FK  case_id (opt)     |              | FK  case_id           |
       | FK  user_id (opt)     |              | FK  specimen_id (opt) |
       |     user_email        |              | FK  uploaded_by       |
       |     user_role         |              |     file_name         |
       |     action            |              |     file_path         |
       |     details           |              |     file_size         |
       |     status            |              |     mime_type         |
       |     ip_address        |              |     category          |
       |     timestamp         |              |     created_at        |
       +-----------------------+              +-----------------------+
```

---

## 3. API Contract Specification

### 3.1 Authentication
- **`POST /api/auth/login`**:
  - Request: `{"email": "prof.adams@hospital.org", "password": "HospitalSecure2024!"}`
  - Response: `{"token": "hex...", "user": {"id": "...", "email": "...", "role": "chair", "full_name": "Prof. E. Adams, MD"}}`
- **`GET /api/auth/me`**: Returns currently authenticated user identity.
- **`POST /api/auth/logout`**: Invalidates session token in database.

### 3.2 Cases & Timeline
- **`GET /api/cases`**: Returns summary list of all registered clinical cases with urgency metadata.
- **`GET /api/cases/{id}`**: Returns specific case demographics and status; records access in audit trail.
- **`GET /api/cases/{id}/timeline`**: Returns chronological sequence of events with computed freshness badges.
- **`GET /api/cases/{id}/evidence-freshness`**: Returns summary counts (`fresh`, `stale`, `missing`, `preliminary`, `superseded`).
- **`GET /api/evidence/{id}/details`**: Returns unedited clinical report, DICOM acquisition tags, and specimen linkages.

### 3.3 Safety-Critical Decision & Governance
- **`POST /api/decisions`**:
  - Requires: Bearer Auth (`chair` or `coordinator` role).
  - Body: `{"case_id": "...", "decision_text": "...", "treatment_pathway": "...", "consensus_level": "...", "evidence_reviewed": ["ev-1", ...], "stale_risk_acknowledged": true}`
  - Unauthorized Attempt: Emits `HTTP 403 Forbidden` and records `SECURITY_ACCESS_REJECTED` in `audit_logs`.
  - Success: Emits `HTTP 200 OK`, stores decision, updates case status, appends MDT Decision event to timeline, and dispatches notification.
- **`POST /api/cases/{id}/acknowledge-stale-data`**: Logs clinician risk acceptance to audit log.
- **`GET /api/cases/{id}/audit-log`**: Returns chronological audit history.

### 3.4 Documents & Integrations
- **`POST /api/cases/{id}/documents`**: Multipart file upload. Validates mime type and file size (< 25MB). Stores file and updates timeline.
- **`GET /api/cases/{id}/specimens/tree`**: Returns hierarchical nested specimen tree.
- **`GET /api/system/integrations`**: Healthcheck endpoint returning PACS, LIS, and Genomics service response times.
- **`GET /api/notifications`**: Returns role-relevant push alerts.

---

## 4. Freshness Calculation Algorithm

```python
def calculate_freshness(evidence_state: str, result_date: datetime, threshold_days: int) -> dict:
    if evidence_state == "missing":
        return {"state": "missing", "badge": "MISSING", "color": "red"}
    if evidence_state == "superseded":
        return {"state": "superseded", "badge": "SUPERSEDED", "color": "gray"}
    if evidence_state == "preliminary":
        return {"state": "preliminary", "badge": "PRELIMINARY", "color": "orange"}
        
    age_days = (datetime.utcnow() - result_date).days
    if age_days <= threshold_days and evidence_state != "stale":
        return {"state": "fresh", "badge": "FRESH", "color": "green", "age": age_days}
    else:
        return {"state": "stale", "badge": "STALE", "color": "red", "age": age_days}
```

---

## 5. Deployment Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- SQLite 3.35+

### Step-by-Step Production Launch
1. **Backend Deployment**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python seed_data.py
   python run.py
   ```
   *Runs on port 8000.*

2. **Frontend Deployment**:
   ```bash
   npm install
   npm run build
   # Or for development:
   npm run dev
   ```
   *The Vite development server proxies `/api` and `/uploads` requests directly to `http://127.0.0.1:8000`.*

3. **Systemd Service Configuration (Linux Example)**:
   ```ini
   [Unit]
   Description=Clinical MDT Decision System FastAPI Service
   After=network.target

   [Service]
   User=clinical-app
   WorkingDirectory=/opt/clinical-mdt/backend
   ExecStart=/usr/bin/python3 run.py
   Restart=always
   EnvironmentFile=/opt/clinical-mdt/backend/.env

   [Install]
   WantedBy=multi-user.target
   ```
