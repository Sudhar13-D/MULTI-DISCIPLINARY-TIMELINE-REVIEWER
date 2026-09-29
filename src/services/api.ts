import {
  UserProfile,
  PatientCase,
  TimelineEvent,
  FreshnessSummary,
  DecisionRecord,
  AuditLogEntry,
  SpecimenNode,
  SystemIntegrations,
  NotificationItem,
} from "../types";

const API_BASE = "/api";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("clinical_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auto-recovering fetch wrapper that transparently authenticates if 401 occurs
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let headers: Record<string, string> = {
    ...getAuthHeader(),
    ...((options.headers as Record<string, string>) || {}),
  };

  let res = await fetch(url, { ...options, headers });

  // If unauthorized (first visit or expired token), auto-login as MDT Chair and retry
  if (res.status === 401 && !url.includes("/auth/login")) {
    try {
      const authRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "prof.adams@hospital.org",
          password: "HospitalSecure2024!",
        }),
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        localStorage.setItem("clinical_token", authData.token);
        headers["Authorization"] = `Bearer ${authData.token}`;
        res = await fetch(url, { ...options, headers });
      }
    } catch {
      // Ignore fallback
    }
  }
  return res;
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Authentication error");
  }
  const data = await res.json();
  localStorage.setItem("clinical_token", data.token);
  return data;
}

export async function getMeApi(): Promise<UserProfile> {
  const res = await fetchWithAuth(`${API_BASE}/auth/me`);
  if (!res.ok) throw new Error("Session invalid");
  return res.json();
}

export async function logoutApi(): Promise<void> {
  await fetchWithAuth(`${API_BASE}/auth/logout`, {
    method: "POST",
  }).catch(() => {});
  localStorage.removeItem("clinical_token");
}

export async function fetchCasesApi(): Promise<PatientCase[]> {
  const res = await fetchWithAuth(`${API_BASE}/cases`);
  if (!res.ok) throw new Error("Failed to load clinical cases");
  return res.json();
}

export async function fetchCaseTimelineApi(caseId: string): Promise<TimelineEvent[]> {
  const res = await fetchWithAuth(`${API_BASE}/cases/${caseId}/timeline`);
  if (!res.ok) throw new Error(`Failed to load timeline for case ${caseId}`);
  return res.json();
}

export async function fetchFreshnessSummaryApi(caseId: string): Promise<FreshnessSummary> {
  const res = await fetchWithAuth(`${API_BASE}/cases/${caseId}/evidence-freshness`);
  if (!res.ok) throw new Error("Failed to load freshness statistics");
  return res.json();
}

export async function fetchEvidenceDetailsApi(eventId: string): Promise<any> {
  const res = await fetchWithAuth(`${API_BASE}/evidence/${eventId}/details`);
  if (!res.ok) throw new Error("Failed to load evidence details");
  return res.json();
}

export async function submitDecisionApi(data: {
  case_id: string;
  decision_text: string;
  treatment_pathway: string;
  consensus_level: string;
  contingency_action?: string;
  evidence_reviewed: string[];
  stale_risk_acknowledged: boolean;
}): Promise<DecisionRecord> {
  const res = await fetchWithAuth(`${API_BASE}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Decision submission failed" }));
    throw new Error(err.detail || `HTTP ${res.status}: Action rejected`);
  }
  return res.json();
}

export async function acknowledgeStaleDataApi(caseId: string, eventIds: string[], rationale: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/cases/${caseId}/acknowledge-stale-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId, event_ids: eventIds, rationale }),
  });
  if (!res.ok) throw new Error("Failed to log stale risk acknowledgment");
}

export async function fetchAuditLogsApi(caseId: string): Promise<AuditLogEntry[]> {
  const res = await fetchWithAuth(`${API_BASE}/cases/${caseId}/audit-log`);
  if (!res.ok) throw new Error("Failed to load audit logs");
  return res.json();
}

export async function fetchSpecimenTreeApi(caseId: string): Promise<SpecimenNode[]> {
  const res = await fetchWithAuth(`${API_BASE}/cases/${caseId}/specimens/tree`);
  if (!res.ok) throw new Error("Failed to load specimen lineage");
  return res.json();
}

export async function uploadDocumentApi(
  caseId: string,
  file: File,
  category: string,
  specimenId?: string,
  notes?: string
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  if (specimenId) formData.append("specimen_id", specimenId);
  if (notes) formData.append("notes", notes);

  const res = await fetchWithAuth(`${API_BASE}/cases/${caseId}/documents`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload error");
  }
  return res.json();
}

export async function fetchIntegrationsHealthApi(): Promise<SystemIntegrations> {
  const res = await fetch(`${API_BASE}/system/integrations`);
  if (!res.ok) throw new Error("Integrations unreachable");
  return res.json();
}

export async function fetchNotificationsApi(): Promise<NotificationItem[]> {
  const res = await fetchWithAuth(`${API_BASE}/notifications`);
  if (!res.ok) return [];
  return res.json();
}

export async function ingestExternalScanApi(
  caseId: string,
  file?: File,
  modality: string = "CT",
  seriesInstanceUid?: string,
  accessionNumber?: string,
  institutionSource?: string
): Promise<any> {
  const formData = new FormData();
  if (file) formData.append("file", file);
  formData.append("modality", modality);
  if (seriesInstanceUid) formData.append("series_instance_uid", seriesInstanceUid);
  if (accessionNumber) formData.append("accession_number", accessionNumber);
  if (institutionSource) formData.append("institution_source", institutionSource);

  const res = await fetchWithAuth(`${API_BASE}/cases/${caseId}/ingest-external-scan`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Scan ingestion failed" }));
    throw new Error(err.detail || "Scan ingestion error");
  }
  return res.json();
}

export async function submitUsabilityFeedbackApi(payload: {
  sus_answers: Record<string, number>;
  task_ratings?: Record<string, number>;
  qualitative_feedback?: string;
  clinical_role?: string;
}): Promise<any> {
  const res = await fetchWithAuth(`${API_BASE}/system/usability/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Feedback submission failed" }));
    throw new Error(err.detail || "Submission error");
  }
  return res.json();
}

