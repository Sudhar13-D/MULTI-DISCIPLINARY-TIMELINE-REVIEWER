import React, { useState, useEffect } from "react";
import { SpecimenNode } from "../../types";
import { fetchSpecimenTreeApi } from "../../services/api";

interface SpecimenTreeViewProps {
  caseId: string;
  onSelectSpecimen?: (specimenId: string) => void;
}

function SpecimenTreeNodeItem({
  node,
  level = 0,
  onSelect,
}: {
  node: SpecimenNode;
  level?: number;
  onSelect?: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getStatusBadge = (status: string) => {
    if (status.toLowerCase().includes("lost")) {
      return "bg-red-100 text-red-700 border-red-300";
    }
    if (status.toLowerCase().includes("process")) {
      return "bg-amber-100 text-amber-700 border-amber-300";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-300";
  };

  return (
    <div className="text-xs">
      <div
        className={`flex items-start gap-2 p-2 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors ${
          level > 0 ? "ml-4 border-l-2 border-l-blue-400 pl-3 my-1" : "my-1.5"
        }`}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 flex-shrink-0 mt-0.5"
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0 text-slate-300 text-center">•</span>
        )}

        <div className="flex-1 min-w-0" onClick={() => onSelect?.(node.id)}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="font-mono font-bold text-slate-800 text-[11px]">{node.id}</span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getStatusBadge(
                node.status
              )}`}
            >
              {node.status}
            </span>
          </div>

          <div className="font-medium text-slate-700 text-xs mt-0.5">{node.label}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Type: {node.type} · Site: {node.anatomic_site || "Unspecified"}
          </div>
          {node.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{node.notes}</div>}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children.map(child => (
            <SpecimenTreeNodeItem key={child.id} node={child} level={level + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpecimenTreeView({ caseId, onSelectSpecimen }: SpecimenTreeViewProps) {
  const [tree, setTree] = useState<SpecimenNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchSpecimenTreeApi(caseId);
        setTree(data);
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [caseId]);

  if (isLoading) {
    return <div className="p-4 text-xs text-slate-400 text-center">Loading specimen lineage tree...</div>;
  }

  if (tree.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400 text-center italic">
        No specimen records indexed for this case.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map(node => (
        <SpecimenTreeNodeItem key={node.id} node={node} onSelect={onSelectSpecimen} />
      ))}
    </div>
  );
}
