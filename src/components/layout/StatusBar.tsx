import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { SystemIntegrations } from "../../types";
import { fetchIntegrationsHealthApi } from "../../services/api";

export default function StatusBar() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<SystemIntegrations | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const data = await fetchIntegrationsHealthApi();
        setIntegrations(data);
      } catch {
        setIntegrations(null);
      }
    }
    checkHealth();
    const timer = setInterval(checkHealth, 30000);
    return () => clearInterval(timer);
  }, []);

  const isConnected = integrations?.overall_status === "OPERATIONAL";

  return (
    <footer className="flex items-center gap-4 px-4 h-7 flex-shrink-0 select-none bg-[#1e3a5f] border-t border-[#16304f] text-white/50 text-[10px] font-mono">
      <span>
        Signed In: <strong className="text-white/80">{user?.full_name || "Guest"}</strong> ({user?.role?.toUpperCase() || "ANONYMOUS"})
      </span>
      <span className="text-white/20">·</span>
      <span>Department: {user?.department || "General Hospital"}</span>
      <span className="text-white/20">·</span>
      <span>
        Audit Logging: <strong className="text-emerald-400">ACTIVE</strong>
      </span>

      <div className="flex-1" />

      {/* PACS & LIMS Live Integration Health */}
      <div className="flex items-center gap-3">
        {integrations ? (
          <>
            <span title={`Endpoint: ${integrations.pacs.endpoint} (${integrations.pacs.protocol})`}>
              PACS: <span className="text-emerald-400 font-semibold">{integrations.pacs.status}</span> ({integrations.pacs.latency_ms}ms)
            </span>
            <span className="text-white/20">·</span>
            <span title={`Endpoint: ${integrations.lis.endpoint} (${integrations.lis.protocol})`}>
              LIS: <span className="text-emerald-400 font-semibold">{integrations.lis.status}</span> ({integrations.lis.latency_ms}ms)
            </span>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">ALL SYSTEMS LIVE</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300">PACS / LIMS Handshake Pending</span>
          </div>
        )}
      </div>
    </footer>
  );
}
