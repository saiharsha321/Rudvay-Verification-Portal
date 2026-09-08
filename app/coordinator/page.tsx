"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/lib/auth/guards";
import { 
  Award, 
  Layers, 
  FileSpreadsheet, 
  FileCheck2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Loader2
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

export default function CoordinatorDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evData, tempResp] = await Promise.all([
          apiClient<any[]>("/events").catch(() => []),
          apiClient<any[]>("/templates").catch(() => [])
        ]);
        setEvents(evData || []);
        setTemplates(tempResp || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-gold-400 mb-1">Coordinator Portal</div>
            <h1 className="text-3xl font-black text-white">Event & Certificate Operations</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/coordinator/generate/single"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <FileCheck2 className="w-4 h-4 text-brand-400" />
              Single Cert
            </Link>
            <Link
              href="/coordinator/generate/bulk"
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-gold-400" />
              Bulk Generate
            </Link>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Events</span>
              <Calendar className="w-5 h-5 text-brand-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{events.length}</div>
            <div className="text-xs text-slate-500 mt-1">Managed workshop sessions</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Templates</span>
              <Layers className="w-5 h-5 text-gold-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{templates.length}</div>
            <div className="text-xs text-slate-500 mt-1">Active certificate designs</div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Delivery Architecture</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2">Zero Storage</div>
            <div className="text-xs text-slate-500 mt-1">In-memory PDF &bull; Pure serverless</div>
          </div>
        </div>

        {/* Recent Events & Templates Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Events Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" /> Registered Events
              </h2>
              <Link href="/coordinator/generate/bulk" className="text-xs text-brand-400 hover:underline">
                Generate for Event &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : events.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No events created yet. Use Bulk Generator to run a new workshop batch.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{ev.name}</div>
                      <div className="text-xs text-slate-400">{ev.date} &bull; {ev.duration || "Self-Paced"}</div>
                    </div>
                    <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-md font-medium">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Templates Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-gold-400" /> Certificate Templates
              </h2>
              <Link href="/coordinator/templates" className="text-xs text-gold-400 hover:underline">
                View Studio &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : templates.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                Default Rudvay Tech template loaded and ready in studio.
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((tpl, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{tpl.name}</div>
                      <div className="text-xs text-slate-400">Version {tpl.currentVersion} &bull; {tpl.pageSize} {tpl.orientation}</div>
                    </div>
                    <Link
                      href={`/coordinator/templates/${tpl.templateId}/designer`}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700"
                    >
                      Edit Design
                    </Link>
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
