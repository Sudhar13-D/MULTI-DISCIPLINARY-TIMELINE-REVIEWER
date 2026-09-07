import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLINICAL_PERSONAS = [
  {
    email: "prof.adams@hospital.org",
    name: "Prof. E. Adams, MD",
    role: "chair",
    desc: "MDT Chair · Medical Oncology (Authorized for Binding Decisions)",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    email: "sarah.mdt@hospital.org",
    name: "Sarah Jenkins, RN",
    role: "coordinator",
    desc: "MDT Coordinator · Cancer Services (Authorized for Binding Decisions)",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    email: "dr.chen@hospital.org",
    name: "Dr. S. Chen, FRCR",
    role: "radiologist",
    desc: "Consultant Radiologist · Diagnostic Radiology (403 on Decisions)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    email: "dr.okafor@hospital.org",
    name: "Dr. M. Okafor, FRCPath",
    role: "pathologist",
    desc: "Lead Pathologist · Cellular Pathology (403 on Decisions)",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
  },
  {
    email: "dr.farooqi@hospital.org",
    name: "Dr. L. Farooqi, PhD",
    role: "molecular",
    desc: "Molecular Pathologist · Genomic Diagnostics (403 on Decisions)",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    email: "dr.nair@hospital.org",
    name: "Dr. R. Nair, FRCP",
    role: "clinician",
    desc: "Referring Clinician · Respiratory Medicine (403 on Decisions)",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
  },
];

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { user, login, quickSwitchPersona } = useAuth();
  const [email, setEmail] = useState("prof.adams@hospital.org");
  const [password, setPassword] = useState("HospitalSecure2024!");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = async (personaEmail: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await quickSwitchPersona(personaEmail);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to switch persona");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold uppercase">
              Authentication & RBAC
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Clinical Staff Single Sign-On
            </h2>
            <div className="text-slate-500 text-xs mt-0.5">
              Current Session: <span className="font-semibold text-slate-800">{user?.full_name || "Guest"}</span> ({user?.role.toUpperCase() || "NONE"})
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-2">
              <span className="text-red-600 font-bold">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Persona Selector for Evaluators */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1.5">
              Quick Role Switch (Evaluator Sandbox)
            </div>
            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
              Click any clinical persona to authenticate as them and test real server-side RBAC validation.
            </p>

            <div className="space-y-1.5">
              {CLINICAL_PERSONAS.map(p => {
                const isActive = user?.email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleSelectPersona(p.email)}
                    disabled={isLoading}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-50/80 border-blue-400 shadow-2xs"
                        : "bg-slate-50 hover:bg-white hover:border-slate-300 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-slate-800 text-xs">{p.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${p.badgeColor}`}>
                        {p.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-2">
              Manual Hospital SSO Login
            </div>
            <form onSubmit={handleFormLogin} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Clinical Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isLoading ? "Authenticating with Server..." : "Authenticate"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
