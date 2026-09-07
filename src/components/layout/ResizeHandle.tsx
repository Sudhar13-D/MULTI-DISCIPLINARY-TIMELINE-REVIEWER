import React from "react";
import { GripIcon, ChevronLeftIcon, ChevronRightIcon } from "../common/Icons";

interface ResizeHandleProps {
  side: "left" | "right";
  isDragging: boolean;
  isCollapsed: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onToggleCollapse: () => void;
  onDoubleClick: () => void;
}

export default function ResizeHandle({
  side,
  isDragging,
  isCollapsed,
  onMouseDown,
  onTouchStart,
  onToggleCollapse,
  onDoubleClick,
}: ResizeHandleProps) {
  return (
    <div
      className={`relative group flex items-center justify-center flex-shrink-0 select-none z-20 transition-colors duration-150 ${
        isDragging ? "bg-blue-500 shadow-md" : "bg-slate-200 hover:bg-blue-400"
      }`}
      style={{
        width: 6,
        cursor: "col-resize",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onDoubleClick}
      title="Drag to resize panel · Double-click to reset width"
    >
      {/* Visual grip indicator */}
      <div
        className={`absolute pointer-events-none transition-opacity duration-150 flex items-center justify-center text-slate-400 group-hover:text-white ${
          isDragging ? "opacity-100 text-white" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <GripIcon size={12} />
      </div>

      {/* Collapse / Expand Toggle Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCollapse();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title={isCollapsed ? `Expand ${side} panel` : `Collapse ${side} panel`}
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-7 rounded flex items-center justify-center bg-white border border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 shadow-sm transition-all duration-150 opacity-0 group-hover:opacity-100 cursor-pointer ${
          side === "left"
            ? isCollapsed
              ? "left-2"
              : "-right-2.5"
            : isCollapsed
            ? "right-2"
            : "-left-2.5"
        }`}
      >
        {side === "left" ? (
          isCollapsed ? <ChevronRightIcon size={10} /> : <ChevronLeftIcon size={10} />
        ) : (
          isCollapsed ? <ChevronLeftIcon size={10} /> : <ChevronRightIcon size={10} />
        )}
      </button>
    </div>
  );
}
