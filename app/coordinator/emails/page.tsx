"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCw, 
  Search, 
  ExternalLink, 
  Loader2, 
  Server, 
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface EmailLogItem {
  id: string;
  certificateId: string;
  recipientEmail: string;
  recipientName: string;
  courseName: string;
  status: "SENT" | "FAILED" | "PREPARED";
  senderEmail: string;
  timestamp: string;
  messageId?: string;
  errorMessage?: string;
}

interface EmailLogsData {
  activeSender: string;
  smtpHost: string;
  isConfigured: boolean;
  totalSent: number;
  totalFailed: number;
  totalLogs: number;
  logs: EmailLogItem[];
}

export default function SentEmailsPage() {
  const [data, setData] = useState<EmailLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient<EmailLogsData>("/emails");
      setData(res);
    } catch (e) {
      console.error("Failed to load email logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const handleResend = async (certId: string, recipientEmail: string) => {
    setResendingId(certId);
    setResendStatus(null);
    try {
      const res = await apiClient<any>("/emails/resend", {
        method: "POST",
        body: JSON.stringify({
          certificateId: certId,
          recipientEmail: recipientEmail
        })
      });
      if (res.success) {
        setResendStatus(`Email successfully resent to ${recipientEmail}!`);
        fetchEmailLogs();
      } else {
        alert("Resend Notice: " + (res.message || "Failed to dispatch email"));
      }
    } catch (err: any) {
      alert("Failed to resend email: " + (err.message || "Unknown error"));
    } finally {
      setResendingId(null);
    }
  };

  const filteredLogs = (data?.logs || []).filter(l => 
    l.recipientEmail.toLowerCase().includes(search.toLowerCase()) ||
    l.recipientName.toLowerCase().includes(search.toLowerCase()) ||
    l.certificateId.toLowerCase().includes(search.toLowerCase()) ||
    l.courseName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Outbound Sent Mails</h1>
              <p className="text-xs text-slate-400">Live delivery status and dispatch audit logs for certificate emails</p>
            </div>
          </div>

          <button
            onClick={fetchEmailLogs}
            disabled={loading}
            className="self-start sm:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-400" : ""}`} /> Refresh Logs
          </button>
        </div>

        {/* System & Delivery Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{data?.totalSent || 0}</div>
              <div className="text-xs text-slate-400">Successfully Delivered</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{data?.totalFailed || 0}</div>
              <div className="text-xs text-slate-400">Failed Delivery Attempts</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{data?.totalLogs || 0}</div>
              <div className="text-xs text-slate-400">Total Email Logs</div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Server className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{data?.activeSender || "info.rudvay@gmail.com"}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" /> Gmail SMTP Active
              </div>
            </div>
          </div>
        </div>

        {resendStatus && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by recipient email, name, or cert ID..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <span className="text-white font-bold">{filteredLogs.length}</span> email records
          </div>
        </div>

        {/* Outbound Email Audit Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
              <p className="text-xs">Loading outbound email logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Mail className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
              <p className="text-sm font-semibold text-white">No Email Logs Found</p>
              <p className="text-xs text-slate-400">Certificates issued with email dispatch enabled will log delivery records here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Recipient</th>
                    <th className="px-6 py-3.5">Certificate ID</th>
                    <th className="px-6 py-3.5">Course / Event</th>
                    <th className="px-6 py-3.5">Sent Time</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.status === "SENT" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> DELIVERED
                          </span>
                        ) : log.status === "FAILED" ? (
                          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">
                            <XCircle className="w-3 h-3" /> FAILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2.5 py-1 rounded-full font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> PREPARED
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{log.recipientName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{log.recipientEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        <Link 
                          href={`/verify/${log.certificateId}`} 
                          target="_blank"
                          className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
                        >
                          {log.certificateId} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="font-medium text-white">{log.courseName}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleResend(log.certificateId, log.recipientEmail)}
                          disabled={resendingId === log.certificateId}
                          className="bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all text-xs border border-slate-700 ml-auto disabled:opacity-50"
                        >
                          {resendingId === log.certificateId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Resend Email
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
