"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { 
  FileSpreadsheet, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

interface BulkJobItem {
  itemId: string;
  recipientName: string;
  recipientEmail: string;
  certificateId: string;
  status: string;
}

interface BulkJob {
  jobId: string;
  eventId: string;
  eventName: string;
  templateId: string;
  totalRecords: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  items: BulkJobItem[];
  createdAt: string;
}

export default function PreviousJobsPage() {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingJobId, setDownloadingJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await apiClient<BulkJob[]>("/jobs");
      setJobs(data || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDownloadBatchPdf = async (job: BulkJob) => {
    setDownloadingJobId(job.jobId);
    try {
      const res = await fetch(`/api/v1/jobs/${encodeURIComponent(job.jobId)}/download`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to download batch PDF");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (job.eventName || "Batch").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `Rudvay_Certificates_${cleanName}_${job.jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to download batch PDF: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingJobId(null);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.eventName.toLowerCase().includes(search.toLowerCase()) ||
    j.jobId.toLowerCase().includes(search.toLowerCase()) ||
    j.templateId.toLowerCase().includes(search.toLowerCase())
  );

  const totalCertificates = jobs.reduce((acc, j) => acc + (j.totalRecords || 0), 0);
  const completedJobs = jobs.filter(j => j.status === "COMPLETED").length;

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-glow">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Previous Generation Batches</h1>
              <p className="text-xs text-slate-400">View historical bulk issuances, download batch PDFs, and monitor delivery progress</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchJobs}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-400" : ""}`} /> Refresh
            </button>
            <Link
              href="/coordinator/generate/bulk"
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow transition-all"
            >
              + Create New Batch
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{jobs.length}</div>
              <div className="text-xs text-slate-400">Total Generation Batches</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalCertificates}</div>
              <div className="text-xs text-slate-400">Total Certificates Generated</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{completedJobs}</div>
              <div className="text-xs text-slate-400">Completed Batches</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event name, batch ID, or template..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Showing <span className="text-white font-bold">{filteredJobs.length}</span> batches
          </div>
        </div>

        {/* Batches Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
              <p className="text-xs">Loading generation batches...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <FileSpreadsheet className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
              <p className="text-sm font-semibold text-white">No Generation Batches Located</p>
              <p className="text-xs text-slate-400">Start a new bulk issuance wizard to generate and download batch certificates.</p>
              <Link
                href="/coordinator/generate/bulk"
                className="inline-block bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                + Create First Batch
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Batch Event Name</th>
                    <th className="px-6 py-3.5">Batch ID</th>
                    <th className="px-6 py-3.5">Certificates</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Created Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredJobs.map((job) => {
                    const isDownloading = downloadingJobId === job.jobId;
                    const isCompleted = job.status === "COMPLETED";

                    return (
                      <tr key={job.jobId} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-sm">{job.eventName || "Bulk Generation Batch"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Template: {job.templateId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                          {job.jobId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-white text-sm">{job.totalRecords || job.items?.length || 0}</span>
                          <span className="text-slate-400 text-[11px] ml-1">certs</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> COMPLETED
                            </span>
                          ) : job.status === "PROCESSING" ? (
                            <span className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">
                              <Clock className="w-3 h-3 animate-spin" /> PROCESSING
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">
                              <Clock className="w-3 h-3" /> QUEUED
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(job.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadBatchPdf(job)}
                              disabled={isDownloading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs shadow-glow disabled:opacity-50"
                              title="Download all certificates as one multi-page PDF"
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-white" />
                              )}
                              <span>{isDownloading ? "Building PDF..." : "Download Batch PDF"}</span>
                            </button>

                            <Link
                              href={`/coordinator/jobs/${job.jobId}`}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all text-xs border border-slate-700"
                            >
                              Details <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
