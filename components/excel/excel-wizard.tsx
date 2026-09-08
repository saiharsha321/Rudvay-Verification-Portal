"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface ExcelWizardProps {
  templateId: string;
  templateVersion: number;
  eventId: string;
  eventName: string;
  onJobCreated: (jobId: string) => void;
}

interface ValidationReport {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  headers: string[];
  validRows: any[];
  errors: { rowNumber: number; field: string; message: string; value: any }[];
}

export const ExcelWizard: React.FC<ExcelWizardProps> = ({
  templateId,
  templateVersion,
  eventId,
  eventName,
  onJobCreated
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: "",
    email: "",
    course: "",
    date: "",
    duration: ""
  });
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: File Upload & Header Parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selected);

      const res = await apiClient<{
        headers: string[];
        sampleRows: any[];
        totalRowCount: number;
        suggestedMapping: Record<string, string>;
      }>("/excel/parse-headers", {
        method: "POST",
        body: formData
      });

      setHeaders(res.headers);
      setMapping(prev => ({
        ...prev,
        ...res.suggestedMapping
      }));
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to parse Excel file");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate Data against Mapped Columns
  const handleValidate = async () => {
    if (!file) return;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mappingJson", JSON.stringify(mapping));

      const report = await apiClient<ValidationReport>("/excel/validate", {
        method: "POST",
        body: formData
      });

      setValidationReport(report);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Launch Bulk Job
  const handleStartGeneration = async () => {
    if (!validationReport || validationReport.validRowsCount === 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient<{ jobId: string }>("/jobs/bulk", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          eventName,
          templateId,
          templateVersion,
          validRows: validationReport.validRows
        })
      });

      onJobCreated(res.jobId);
    } catch (err: any) {
      setError(err.message || "Failed to start bulk generation job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 max-w-4xl mx-auto shadow-2xl">
      {/* Stepper Header */}
      <div className="flex items-center justify-between pb-8 border-b border-slate-800 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
            {step}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {step === 1 && "Upload Excel / CSV"}
              {step === 2 && "Map Excel Columns to Placeholders"}
              {step === 3 && "Pre-Flight Validation & Dispatch"}
            </h2>
            <p className="text-xs text-slate-400">Step {step} of 3 &bull; Target Event: {eventName || "Selected Event"}</p>
          </div>
        </div>

        {file && (
          <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {file.name}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-2xl p-12 text-center bg-slate-950/40 transition-colors">
          <input
            type="file"
            id="excel-file-input"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer block">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4 text-brand-400">
              {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Click to Upload Participant Spreadsheet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Supports .xlsx, .xls, and .csv files. Maximum 2,500 rows per batch.
            </p>
            <span className="inline-block bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-glow">
              Choose File
            </span>
          </label>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className="space-y-6">
          <p className="text-sm text-slate-300">
            Confirm or select the corresponding Excel column header for each certificate placeholder:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Recipient Name *", required: true },
              { key: "email", label: "Email Address *", required: true },
              { key: "course", label: "Course / Program *", required: true },
              { key: "date", label: "Completion Date *", required: true },
              { key: "duration", label: "Duration / Hours", required: false },
            ].map(item => (
              <div key={item.key} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {item.label} <span className="text-brand-400 font-mono text-[10px]">&#123;&#123;{item.key}&#125;&#125;</span>
                </label>
                <select
                  value={mapping[item.key] || ""}
                  onChange={(e) => setMapping({ ...mapping, [item.key]: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back to Upload
            </button>
            <button
              onClick={handleValidate}
              disabled={loading || !mapping.name || !mapping.email || !mapping.course}
              className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Validate Spreadsheet Data
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Validation Report & Run */}
      {step === 3 && validationReport && (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Rows</div>
              <div className="text-2xl font-bold text-white mt-1">{validationReport.totalRows}</div>
            </div>
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 text-center">
              <div className="text-xs text-emerald-400 uppercase tracking-wider">Valid Recipients</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{validationReport.validRowsCount}</div>
            </div>
            <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/30 text-center">
              <div className="text-xs text-red-400 uppercase tracking-wider">Invalid Rows</div>
              <div className="text-2xl font-bold text-red-400 mt-1">{validationReport.invalidRowsCount}</div>
            </div>
          </div>

          {/* Validation Errors List (if any) */}
          {validationReport.errors.length > 0 && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 max-h-48 overflow-y-auto">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                Skipped Invalid Rows ({validationReport.errors.length})
              </h4>
              <div className="space-y-1 text-xs text-slate-300">
                {validationReport.errors.slice(0, 10).map((err, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-red-400">Row {err.rowNumber}:</span>
                    <span>{err.message}</span>
                    {err.value && <span className="text-slate-500">(&quot;{String(err.value)}&quot;)</span>}
                  </div>
                ))}
                {validationReport.errors.length > 10 && (
                  <div className="text-slate-500 text-[11px] pt-1">
                    + {validationReport.errors.length - 10} more invalid rows skipped
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Modify Mapping
            </button>

            <button
              onClick={handleStartGeneration}
              disabled={loading || validationReport.validRowsCount === 0}
              className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 hover:from-brand-500 hover:to-brand-400 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-glow transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-gold-400" />}
              Generate {validationReport.validRowsCount} Certificates
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
