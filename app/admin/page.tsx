"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { 
  Users, 
  Award, 
  Mail, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Plus, 
  Search,
  ExternalLink
} from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [revokeCertId, setRevokeCertId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [m, logs] = await Promise.all([
        apiClient<any>("/admin/metrics").catch(() => ({ totalCertificates: 0, validCertificates: 0, revokedCertificates: 0, totalCoordinators: 0, totalJobs: 0 })),
        apiClient<any[]>("/admin/audit-logs?limit=15").catch(() => [])
      ]);
      setMetrics(m);
      setAuditLogs(logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeCertId || !revokeReason) return;
    setRevoking(true);
    setRevokeSuccess(null);
    try {
      await apiClient<any>(`/admin/certificates/${revokeCertId.trim()}/revoke`, {
        method: "POST",
        body: JSON.stringify({ reason: revokeReason })
      });
      setRevokeSuccess(`Certificate ${revokeCertId} has been successfully revoked.`);
      setRevokeCertId("");
      setRevokeReason("");
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || "Failed to revoke certificate");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-gold-400 mb-1">Administrator Portal</div>
            <h1 className="text-3xl font-black text-white">Platform Governance & Security</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/coordinators"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700"
            >
              <Users className="w-4 h-4 text-brand-400" /> Manage Coordinators
            </Link>
            <Link
              href="/admin/smtp"
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow"
            >
              <Mail className="w-4 h-4 text-gold-400" /> SMTP Config
            </Link>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Issued</span>
              <Award className="w-5 h-5 text-brand-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{metrics?.totalCertificates || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Platform-wide total</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Valid Records</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2">{metrics?.validCertificates || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Active certifications</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Revoked</span>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-black text-red-400 mt-2">{metrics?.revokedCertificates || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Invalidated certificates</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coordinators</span>
              <Users className="w-5 h-5 text-gold-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{metrics?.totalCoordinators || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Authorized issuers</div>
          </div>
        </div>

        {/* Action Grids: Revocation Tool & Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Revocation Control (1 col) */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-red-500/30 bg-red-950/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                <ShieldAlert className="w-5 h-5" /> Revoke Certificate
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Instantly invalidate a fraudulent or compromised certificate. Public verification will reflect REVOKED immediately.
              </p>

              {revokeSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  {revokeSuccess}
                </div>
              )}

              <form onSubmit={handleRevoke} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Certificate ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RT-2026-7K9P4X"
                    value={revokeCertId}
                    onChange={(e) => setRevokeCertId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Revocation Reason</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide audit justification (e.g. Participant failed requirements / Disciplinary action)"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={revoking}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {revoking ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Revocation"}
                </button>
              </form>
            </div>
          </div>

          {/* Audit Logs Stream (2 cols) */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" /> Immutable Audit Trail
              </h3>
              <span className="text-xs text-slate-500 font-mono">Real-time Stream</span>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No audit logs recorded yet.</div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">
                        <span className="text-brand-400 font-mono mr-2">[{log.action}]</span>
                        Target: {log.targetType} / {log.targetId}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Actor: {log.actorRole} ({log.actorUid}) &bull; {log.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
