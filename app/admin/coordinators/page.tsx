"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function CoordinatorsManagementPage() {
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCoordinators = async () => {
    try {
      const res = await apiClient<any[]>("/admin/coordinators");
      setCoordinators(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient<any>("/admin/coordinators", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setSuccess(`Coordinator '${name}' successfully provisioned with custom claims.`);
      setName("");
      setEmail("");
      setPassword("");
      fetchCoordinators();
    } catch (err: any) {
      setError(err.message || "Failed to create coordinator");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (uid: string, currentActive: boolean) => {
    try {
      await apiClient<any>(`/admin/coordinators/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !currentActive })
      });
      fetchCoordinators();
    } catch (e) {
      alert("Failed to toggle coordinator status");
    }
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Coordinator Management</h1>
            <p className="text-xs text-slate-400">Authorize staff members to design templates and issue certificates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Create Coordinator Form */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-400" /> Add Coordinator
            </h3>
            <p className="text-xs text-slate-400 mb-6">Provisions Firebase Auth user with role: COORDINATOR</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coordinator A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="coord_a@rudvaytech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-glow transition-all disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create & Authorize"}
              </button>
            </form>
          </div>

          {/* Coordinators List */}
          <div className="lg:col-span-2 glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Active Coordinators</h3>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : coordinators.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">No coordinators created yet.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {coordinators.map((c, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                    <div>
                      <div className="font-bold text-white text-sm">{c.name || "Coordinator"}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"
                      }`}>
                        {c.active ? "ENABLED" : "DISABLED"}
                      </span>
                      <button
                        onClick={() => handleToggle(c.coordinatorId, c.active)}
                        className="text-xs text-slate-400 hover:text-white px-3 py-1 bg-slate-900 rounded-lg border border-slate-800"
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
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
