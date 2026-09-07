export type Category = "imaging" | "pathology" | "molecular" | "review";
export type Status = "complete" | "pending" | "stale" | "missing" | "conflict";
export type Urgency = "critical" | "urgent" | "routine";
export type RoleId = "chair" | "coordinator" | "radiologist" | "pathologist" | "molecular" | "clinician";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: RoleId;
  department: string;
}

export interface FreshnessBadge {
  state: "fresh" | "stale" | "preliminary" | "missing" | "superseded" | "unknown";
  icon: string;
  color: string;
  label: string;
  tooltip: string;
  age_days?: number | null;
}

export interface FreshnessSummary {
  case_id: string;
  fresh_count: int;
  stale_count: int;
  missing_count: int;
  preliminary_count: int;
  superseded_count: int;
  total_count: int;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  timestamp: string;
  event_type: Category | string;
  subtype: string;
  specimen_id?: string | null;
  result_date: string;
  received_date: string;
  evidence_state: string;
  is_preliminary: boolean;
  is_final: boolean;
  freshness_threshold_days: number;
  is_stale: boolean;
  title: string;
  summary: string;
  full_report?: string | null;
  report_id?: string | null;
  visible_roles: RoleId[];
  freshness_badge: FreshnessBadge;
}

export interface SpecimenNode {
  id: string;
  case_id: string;
  label: string;
  type: string;
  parent_id?: string | null;
  status: string;
  collection_date: string;
  anatomic_site?: string | null;
  notes?: string | null;
  children: SpecimenNode[];
}

export interface DecisionRecord {
  id: string;
  case_id: string;
  submitted_by_user_id: string;
  submitted_by_name: string;
  submitted_by_role: string;
  decision_text: string;
  treatment_pathway: string;
  consensus_level: string;
  contingency_action?: string | null;
  evidence_reviewed: string[];
  stale_risk_acknowledged: boolean;
  status: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  case_id?: string | null;
  user_id?: string | null;
  user_email: string;
  user_role: string;
  action: string;
  details: string;
  status: string;
  ip_address?: string | null;
  timestamp: string;
}

export interface PatientCase {
  id: string;
  patient_de_id: string;
  age: number;
  sex: string;
  primary_dx: string;
  referring_dept: string;
  urgency: Urgency;
  decision_required_by_hours: number;
  complexity: string;
  baseline_minutes: number;
  target_minutes: number;
  status: string;
  next_action?: string | null;
  created_at: string;
}

export interface IntegrationStatus {
  name: string;
  protocol: string;
  endpoint: string;
  status: string;
  latency_ms: number;
  last_handshake: string;
  details: string;
}

export interface SystemIntegrations {
  pacs: IntegrationStatus;
  lis: IntegrationStatus;
  genomics_lab: IntegrationStatus;
  ehr: IntegrationStatus;
  overall_status: string;
}

export interface NotificationItem {
  id: string;
  case_id?: string | null;
  recipient_role?: string | null;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  created_at: string;
}

export interface RoleConfig {
  id: RoleId;
  label: string;
  abbr: string;
}
