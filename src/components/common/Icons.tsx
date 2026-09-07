import React from "react";
import { Category } from "../../types";
import { CAT } from "../../data/patients";

export function CatIcon({ category, size = 14 }: { category: Category; size?: number }) {
  const icons = {
    imaging: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 3v-.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    pathology: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M6 2h4v8l-2 4-2-4V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5 6h6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    molecular: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 4h4M5.3 5.3 8 10M10.7 5.3 8 10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    review: (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M3 4h10M3 8h7M3 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="m12 12 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return <span style={{ color: CAT[category].color }}>{icons[category]}</span>;
}

export function GripIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 6 16" fill="currentColor">
      <circle cx="2" cy="3" r="1" />
      <circle cx="2" cy="8" r="1" />
      <circle cx="2" cy="13" r="1" />
      <circle cx="4" cy="3" r="1" />
      <circle cx="4" cy="8" r="1" />
      <circle cx="4" cy="13" r="1" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M10 13L5 8L10 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
