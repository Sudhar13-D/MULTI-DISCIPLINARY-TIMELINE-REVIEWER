import React from "react";
import { FreshnessBadge } from "../../types";

interface FreshnessIndicatorProps {
  badge: FreshnessBadge;
  showAge?: boolean;
}

export default function FreshnessIndicator({ badge, showAge = true }: FreshnessIndicatorProps) {
  const getStyle = () => {
    switch (badge.state) {
      case "fresh":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-300",
          dot: "bg-emerald-500",
        };
      case "stale":
        return {
          bg: "bg-red-50 text-red-700 border-red-300",
          dot: "bg-red-500 animate-pulse",
        };
      case "preliminary":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-300",
          dot: "bg-amber-500 animate-pulse",
        };
      case "missing":
        return {
          bg: "bg-rose-100 text-rose-800 border-rose-300",
          dot: "bg-rose-600",
        };
      case "superseded":
        return {
          bg: "bg-slate-100 text-slate-500 border-slate-300 line-through opacity-75",
          dot: "bg-slate-400",
        };
      default:
        return {
          bg: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400",
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold transition-all select-none ${style.bg}`}
      title={badge.tooltip}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
      <span>{badge.label}</span>
      {showAge && badge.age_days !== undefined && badge.age_days !== null && (
        <span className="opacity-75 font-normal">({badge.age_days}d)</span>
      )}
    </div>
  );
}
