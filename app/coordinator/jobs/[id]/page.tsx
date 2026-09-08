"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Play, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const autoRunRef = useRef(false);

  const fetchJobStatus = async () => {
    if (!jobId) return;
    try {
      const data = await apiClient<any>(`/jobs/${jobId}`);
      setJob(data);
      setItems(data.items || []);
      return data;
    } catch (e) {
      console.error("Failed to fetch job", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobStatus();
  }, [jobId]);

  // Auto chunk execution runner
  const processNextChunk = async () => {
    if (!jobId) return;
    setIsProcessing(true);
    try {
      const res = await apiClient<any>(`/jobs/${jobId}/process-chunk?chunk_size=25`, {
        method: "POST"
      });
      const updatedJob = await fetchJobStatus();
      
      // If still items remaining, continue runner
      if (updatedJob && updatedJob.status === "PROCESSING" && !updatedJob.isDone && autoRunRef.current) {
        setTimeout(() => processNextChunk(), 500);
      } else {
        setIsProcessing(false);
        autoRunRef.current = false;
      }
    } catch (e) {
      setIsProcessing(false);
      autoRunRef.current = false;
      fetchJobStatus();
    }
  };

  const handleStartAutoRunner = () => {
    autoRunRef.current = true;
    processNextChunk();
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      await apiClient<any>(`/jobs/${jobId}/retry-failed`, {
        method: "POST"
      });
      await fetchJobStatus();
    } catch (e) {
      alert("Failed to retry records");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
        <p>Loading bulk generation job status...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-slate-400">
        <p>Job not found</p>
        <Link href="/coordinator" className="text-brand-400 hover:underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const total = job.totalRecords || 1;
  const processed = job.processedRecords || 0;
  const success = job.successfulRecords || 0;
  const failed = job.failedRecords || 0;
  const percent = Math.min(100, Math.round((processed / total) * 100));

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-6">
          <Link href="/coordinator" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Job Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-gold-400">Generation Job</div>
              <h1 className="text-2xl font-black text-white mt-0.5">{job.eventName || "Bulk Generation Batch"}</h1>
              <div className="text-xs text-slate-400 font-mono mt-1">ID: {job.jobId}</div>
            </div>

            <div className="flex items-center gap-3">
              {job.status !== "COMPLETED" && (
                <button
                  onClick={handleStartAutoRunner}
                  disabled={isProcessing}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isProcessing ? "Processing Batch..." : "Process Next Batch"}
                </button>
              )}

              {failed > 0 && (
                <button
                  onClick={handleRetryFailed}
                  disabled={retrying}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Retry Failed ({failed})
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
              <span>Overall Progress: {percent}%</span>
              <span>{processed} / {total} Processed</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                style={{ width: `${percent}%` }}
                className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 transition-all duration-500"
              />
            </div>
          </div>

          {/* Metrics Counter */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Total Items</div>
              <div className="text-xl font-bold text-white mt-1">{total}</div>
            </div>
            <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/30 text-center">
              <div className="text-[11px] uppercase tracking-wider text-emerald-400">Successful & Emailed</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{success}</div>
            </div>
            <div className="bg-red-950/20 p-4 rounded-xl border border-red-500/30 text-center">
              <div className="text-[11px] uppercase tracking-wider text-red-400">Failed Records</div>
              <div className="text-xl font-bold text-red-400 mt-1">{failed}</div>
            </div>
          </div>
        </div>

        {/* Row Items Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Item Records Status</h3>
            <button
              onClick={fetchJobStatus}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Row</th>
                  <th className="py-3.5 px-4 font-semibold">Recipient</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Certificate ID</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item, idx) => {
                  const isSuccess = item.status === "SUCCESS";
                  const isFailed = item.status === "FAILED";
                  const rowData = item.rowData || {};

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-mono">{item.rowNumber || idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-white">{rowData.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{item.recipientEmail || rowData.email}</td>
                      <td className="py-3 px-4 font-mono text-brand-400">
                        {item.certificateId || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isSuccess ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          isFailed ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.certificateId && (
                          <Link
                            href={`/verify/${item.certificateId}`}
                            target="_blank"
                            className="text-brand-400 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            Verify <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        {isFailed && item.errorMessage && (
                          <span className="text-red-400 text-[11px]" title={item.errorMessage}>
                            {item.errorMessage.substring(0, 30)}...
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
