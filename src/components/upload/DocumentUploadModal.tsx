import React, { useState } from "react";
import { uploadDocumentApi } from "../../services/api";

interface DocumentUploadModalProps {
  caseId: string;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const CATEGORIES = [
  { id: "imaging", label: "Diagnostic Imaging (DICOM / Scans)" },
  { id: "pathology", label: "Histopathology / Cytology Report" },
  { id: "molecular", label: "Molecular Genomics / NGS Data" },
  { id: "clinical_report", label: "External Consultation Note" },
];

export default function DocumentUploadModal({
  caseId,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("imaging");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 25 * 1024 * 1024) {
        setErrorMsg("Selected file exceeds the 25MB safety limit.");
        setFile(null);
        return;
      }
      setErrorMsg(null);
      setFile(selected);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      await uploadDocumentApi(caseId, file, category, undefined, notes);
      setSuccessMsg("Document uploaded and attached to case timeline successfully!");
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold uppercase">
              External Document Attachment
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Upload Clinical Document or Scan
            </h2>
            <div className="text-slate-500 text-xs mt-0.5">Attach reports to Case {caseId}</div>
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

        {/* Body Form */}
        <form onSubmit={handleUpload} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-2">
              <span className="text-red-600 font-bold">⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Evidence Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* File Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Document or DICOM Archive *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.dcm,.png,.jpg,.jpeg,.tiff,.csv"
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 mt-2">
                Supported formats: PDF, DICOM (.dcm), PNG, JPG, TIFF, CSV (Max 25MB)
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Context & Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. 'External pelvic MRI performed at City Hospital on 12-Nov-2024'"
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 -mx-5 -mb-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading & Validating..." : "Upload & Integrate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
