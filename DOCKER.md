# Docker Deployment Guide - Clinical MDT Platform

This directory contains full containerization support for the **Clinical MDT Decision System**, including multi-stage builds for the React frontend, production Nginx reverse proxy, and FastAPI backend.

---

## 1. Quick Start with Docker Compose

To launch the complete MDT application (frontend + backend + database) in one command:

```bash
# Inside the MDT directory:
docker compose up --build
```

- **Frontend (Nginx + React SPA)**: [http://localhost:5173](http://localhost:5173)
- **Backend (FastAPI REST API)**: [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

To run in the background (detached mode):
```bash
docker compose up -d
```

To stop all containers:
```bash
docker compose down
```

---

## 2. Architecture & Container Layout

```
                        ┌─────────────────────────────────────────┐
                        │              Host Machine               │
                        └───────┬─────────────────────────┬───────┘
           Port 5173 (Browser)  │                         │ Port 8000 (API)
                                ▼                         ▼
               ┌─────────────────────────────┐   ┌─────────────────────────────┐
               │    Container: mdt-frontend  │   │    Container: mdt-backend   │
               │   - Nginx Alpine            │   │   - Python 3.11-slim        │
               │   - React 19 Production SPA │   │   - FastAPI + Uvicorn       │
               │   - Reverse Proxy:          │   │   - SQLite WAL Mode         │
               │       /api/    ──(proxy)───┼───►   - RBAC & Audit Engine     │
               │       /uploads/──(proxy)───┼───►                             │
               └─────────────────────────────┘   └──────────────┬──────────────┘
                                                                │
                                                  Persistent Docker Volumes:
                                                  ├── mdt_data (DB storage)
                                                  └── mdt_uploads (Evidence)
```

---

## 3. Individual Container Builds

### Backend Container Standalone:
```bash
# Build backend image
docker build -t mdt-backend ./backend

# Run backend container
docker run -d -p 8000:8000 --name mdt-backend mdt-backend
```

### Frontend Container Standalone:
```bash
# Build frontend image
docker build -t mdt-frontend .

# Run frontend container
docker run -d -p 5173:80 --name mdt-frontend mdt-frontend
```

---

## 4. Configuration & Environment Variables

| Variable | Service | Default | Description |
|---|---|---|---|
| `HOST` | Backend | `0.0.0.0` | Bind IP for Uvicorn |
| `PORT` | Backend | `8000` | HTTP port for FastAPI backend |
| `DB_PATH` | Backend | `clinical_mdt.db` | Custom path to SQLite database |

---

## 5. Persistent Volumes

Docker Compose automatically creates and manages two volumes:
* `mdt_data`: Stores the persistent SQLite database (`clinical_mdt.db`) ensuring data survival across container recreations.
* `mdt_uploads`: Stores de-identified clinical PDF and pathology document attachments.
