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

export async function loginApi(email: string, password: string):Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Authentication error");
  }
  return res.json();
}

export async function getMeApi(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Session invalid");
  return res.json();
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { ...getAuthHeader() },
  }).catch(() => {});
  localStorage.removeItem("clinical_token");
}

export async function fetchCasesApi(): Promise<PatientCase[]> {
  const res = await fetch(`${API_BASE}/cases`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load clinical cases");
  return res.json();
}

export async function fetchCaseTimelineApi(caseId: string): Promise<TimelineEvent[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/timeline`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error(`Failed to load timeline for case ${caseId}`);
  return res.json();
}

export async function fetchFreshnessSummaryApi(caseId: string): Promise<FreshnessSummary> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/evidence-freshness`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load freshness statistics");
  return res.json();
}

export async function fetchEvidenceDetailsApi(eventId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/evidence/${eventId}/details`, {
    headers: { ...getAuthHeader() },
  });
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
  const res = await fetch(`${API_BASE}/decisions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Decision submission failed" }));
    throw new Error(err.detail || `HTTP ${res.status}: Action rejected`);
  }
  return res.json();
}

export async function acknowledgeStaleDataApi(caseId: string, eventIds: string[], rationale: string): Promise<void> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/acknowledge-stale-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ case_id: caseId, event_ids: eventIds, rationale }),
  });
  if (!res.ok) throw new Error("Failed to log stale risk acknowledgment");
}

export async function fetchAuditLogsApi(caseId: string): Promise<AuditLogEntry[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/audit-log`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load audit logs");
  return res.json();
}

export async function fetchSpecimenTreeApi(caseId: string): Promise<SpecimenNode[]> {
  const res = await fetch(`${API_BASE}/cases/${caseId}/specimens/tree`, {
    headers: { ...getAuthHeader() },
  });
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

  const res = await fetch(`${API_BASE}/cases/${caseId}/documents`, {
    method: "POST",
    headers: { ...getAuthHeader() },
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
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) return [];
  return res.json();
}
