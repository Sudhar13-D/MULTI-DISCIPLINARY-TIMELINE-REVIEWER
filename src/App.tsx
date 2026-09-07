import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PatientCase, TimelineEvent, FreshnessSummary } from "./types";
import {
  fetchCasesApi,
  fetchCaseTimelineApi,
  fetchFreshnessSummaryApi,
  fetchNotificationsApi,
  acknowledgeStaleDataApi,
} from "./services/api";
import { useResizablePanels } from "./hooks/useResizablePanels";

import Header from "./components/layout/Header";
import StatusBar from "./components/layout/StatusBar";
import ResizeHandle from "./components/layout/ResizeHandle";
import PatientSidebar from "./components/sidebar/PatientSidebar";
import UnifiedTimelineView from "./components/timeline/UnifiedTimelineView";
import DetailPanel from "./components/detail/DetailPanel";

import LoginModal from "./components/auth/LoginModal";
import DecisionFormWithEvidenceCheckboxes from "./components/decision/DecisionFormWithEvidenceCheckboxes";
import DocumentUploadModal from "./components/upload/DocumentUploadModal";
import EvidenceDrillDownModal from "./components/evidence/EvidenceDrillDownModal";
import AuditLogDrawer from "./components/audit/AuditLogDrawer";

// Immediate baseline cases so first load renders immediately without needing a browser reload
const INITIAL_CASES: PatientCase[] = [
  {
    id: "001",
    patient_de_id: "Patient_A_68M",
    age: 68,
    sex: "M",
    primary_dx: "Acute Saddle Pulmonary Embolism with RV Strain",
    referring_dept: "Emergency Medicine",
    urgency: "urgent",
    decision_required_by_hours: 2,
    complexity: "high",
    baseline_minutes: 45,
    target_minutes: 8,
    status: "active",
    next_action: "Awaiting STAT Emergency MDT Review",
    created_at: new Date().toISOString(),
  },
  {
    id: "002",
    patient_de_id: "Patient_B_54F",
    age: 54,
    sex: "F",
    primary_dx: "Rectal Adenocarcinoma T4b N2 (MSS)",
    referring_dept: "Colorectal Surgery",
    urgency: "routine",
    decision_required_by_hours: 168,
    complexity: "high",
    baseline_minutes: 35,
    target_minutes: 7,
    status: "active",
    next_action: "Awaiting MDT Staging Review",
    created_at: new Date().toISOString(),
  },
];

function MainDashboard() {
  const { user, token } = useAuth();
  const [cases, setCases] = useState<PatientCase[]>(INITIAL_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("001");
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [freshnessSummary, setFreshnessSummary] = useState<FreshnessSummary | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([
    "imaging",
    "pathology",
    "molecular",
    "review",
  ]);
  const [freshnessFilter, setFreshnessFilter] = useState<string | null>(null);
  const [reviewedEventIds, setReviewedEventIds] = useState<string[]>([]);
  const [drillDownEvent, setDrillDownEvent] = useState<TimelineEvent | null>(null);

  // Modal Visibility States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Set document title to MDT
  useEffect(() => {
    document.title = "MDT";
  }, []);

  // Resizable Panels Hook
  const {
    leftWidth,
    rightWidth,
    isLeftCollapsed,
    isRightCollapsed,
    isDraggingLeft,
    isDraggingRight,
    startLeftResize,
    startRightResize,
    toggleLeftCollapse,
    toggleRightCollapse,
    resetLeftWidth,
    resetRightWidth,
  } = useResizablePanels({
    left: { defaultWidth: 260, minWidth: 190, maxWidth: 420 },
    right: { defaultWidth: 340, minWidth: 260, maxWidth: 560 },
  });

  // Load all cases on mount and whenever auth state settles
  const loadCases = useCallback(async () => {
    try {
      const data = await fetchCasesApi();
      if (data && data.length > 0) {
        setCases(data);
      }
    } catch (err) {
      console.warn("Retrying cases load...", err);
    }
  }, []);

  useEffect(() => {
    loadCases();
    const timer = setTimeout(loadCases, 800);
    return () => clearTimeout(timer);
  }, [loadCases, user, token]);

  // Load timeline & freshness when selectedCaseId changes
  const refreshCaseData = useCallback(async () => {
    if (!selectedCaseId) return;
    try {
      const [timeline, freshness, notifs] = await Promise.all([
        fetchCaseTimelineApi(selectedCaseId),
        fetchFreshnessSummaryApi(selectedCaseId),
        fetchNotificationsApi(),
      ]);
      setTimelineEvents(timeline);
      setFreshnessSummary(freshness);
      setUnreadNotifsCount(notifs.filter(n => !n.is_read).length);
      if (timeline.length > 0 && !selectedEventId) {
        setSelectedEventId(timeline[0].id);
      }
    } catch (err) {
      console.warn("Refreshing case data...", err);
    }
  }, [selectedCaseId, selectedEventId]);

  useEffect(() => {
    refreshCaseData();
    const timer = setTimeout(refreshCaseData, 900);
    return () => clearTimeout(timer);
  }, [selectedCaseId, refreshCaseData, user, token]);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0] || INITIAL_CASES[0];
  const selectedEvent = timelineEvents.find(e => e.id === selectedEventId) || null;

  const handleToggleCategory = (cat: string) => {
    setActiveCategories(prev =>
      prev.includes(cat)
        ? prev.length > 1
          ? prev.filter(c => c !== cat)
          : prev
        : [...prev, cat]
    );
  };

  const handleDrillDown = (event: TimelineEvent) => {
    setDrillDownEvent(event);
    if (!reviewedEventIds.includes(event.id)) {
      setReviewedEventIds(prev => [...prev, event.id]);
    }
  };

  const handleAcknowledgeStale = async (eventId: string) => {
    if (!activeCase) return;
    try {
      await acknowledgeStaleDataApi(activeCase.id, [eventId], "Clinician acknowledged reliance during drill-down.");
      await refreshCaseData();
      alert("Risk acknowledgment recorded in audit trail.");
    } catch (err: any) {
      alert("Failed to record acknowledgment: " + err.message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 font-sans select-text">
      {/* ── Top Header with Auth & Case Tabs ─────────────────────── */}
      <Header
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={id => {
          setSelectedCaseId(id);
          setSelectedEventId(null);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAuditLog={() => setIsAuditDrawerOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenDecisionForm={() => setIsDecisionModalOpen(true)}
        unreadNotificationCount={unreadNotifsCount}
      />

      {/* ── Main Resizable Clinical Workspace ───────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Left Sidebar (Demographics & Specimen Lineage) ──────── */}
        <PatientSidebar
          patientCase={activeCase}
          timelineEvents={timelineEvents}
          width={leftWidth}
        />

        {/* ── Left Resize Handle ──────────────────────────────────── */}
        <ResizeHandle
          side="left"
          isDragging={isDraggingLeft}
          isCollapsed={isLeftCollapsed}
          onMouseDown={startLeftResize}
          onTouchStart={startLeftResize}
          onToggleCollapse={toggleLeftCollapse}
          onDoubleClick={resetLeftWidth}
        />

        {/* ── Center Unified Longitudinal Timeline ────────────────── */}
        <UnifiedTimelineView
          patientCase={activeCase}
          events={timelineEvents}
          freshnessSummary={freshnessSummary}
          selectedEventId={selectedEventId}
          onSelectEvent={setSelectedEventId}
          onDrillDown={handleDrillDown}
          activeCategories={activeCategories}
          onToggleCategory={handleToggleCategory}
          activeFreshnessFilter={freshnessFilter}
          onSelectFreshnessFilter={setFreshnessFilter}
        />

        {/* ── Right Resize Handle ─────────────────────────────────── */}
        <ResizeHandle
          side="right"
          isDragging={isDraggingRight}
          isCollapsed={isRightCollapsed}
          onMouseDown={startRightResize}
          onTouchStart={startRightResize}
          onToggleCollapse={toggleRightCollapse}
          onDoubleClick={resetRightWidth}
        />

        {/* ── Right Detail Panel (Findings & Actions) ─────────────── */}
        <DetailPanel
          event={selectedEvent}
          width={rightWidth}
          onClose={() => setSelectedEventId(null)}
          onOpenDrillDown={handleDrillDown}
          onOpenDecisionForm={() => setIsDecisionModalOpen(true)}
        />
      </div>

      {/* ── Bottom Live PACS / LIMS Status Bar ───────────────────── */}
      <StatusBar />

      {/* ── Modals & Drawers ─────────────────────────────────────── */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {isDecisionModalOpen && (
        <DecisionFormWithEvidenceCheckboxes
          patientCase={activeCase}
          timelineEvents={timelineEvents}
          initialReviewedIds={reviewedEventIds}
          onClose={() => setIsDecisionModalOpen(false)}
          onDecisionSubmitted={() => {
            refreshCaseData();
            setIsDecisionModalOpen(false);
          }}
        />
      )}

      {isUploadModalOpen && (
        <DocumentUploadModal
          caseId={activeCase.id}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={() => {
            refreshCaseData();
            setIsUploadModalOpen(false);
          }}
        />
      )}

      <EvidenceDrillDownModal
        event={drillDownEvent}
        onClose={() => setDrillDownEvent(null)}
        onAcknowledgeStale={handleAcknowledgeStale}
      />

      <AuditLogDrawer
        caseId={activeCase.id}
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
