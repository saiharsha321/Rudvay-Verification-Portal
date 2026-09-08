"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { Layers, Plus, Edit, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { INITIAL_TEMPLATES } from "@/lib/templates/default-templates";

export default function TemplatesListPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await apiClient<any[]>("/templates");
      if (res && res.length > 0) {
        setTemplates(res);
      } else {
        setTemplates(INITIAL_TEMPLATES);
      }
    } catch (e) {
      console.error(e);
      setTemplates(INITIAL_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded">
                STUDIO ENGINE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">Certificate Templates</h1>
            <p className="text-xs text-slate-400">Design, version, and manage high-fidelity certificate layouts</p>
          </div>
          <Link
            href="/coordinator/templates/new"
            className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Template
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
            <p className="text-xs">Loading certificate templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Custom Templates Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">Create your first certificate layout with our visual canvas editor.</p>
            <Link
              href="/coordinator/templates/new"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-glow"
            >
              <Plus className="w-4 h-4" /> Launch Designer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, idx) => (
              <div 
                key={tpl.templateId || idx} 
                className="glass-panel rounded-2xl border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between glass-panel-hover transition-all relative overflow-hidden group"
              >
                {tpl.name === "testing1" && (
                  <div className="absolute top-0 right-0 bg-brand-600 text-[9px] font-bold text-white px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    TEST SAMPLE
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-mono bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-md font-semibold">
                      v{tpl.currentVersion || 1}
                    </span>
                    <span className="text-xs text-slate-500">{tpl.pageSize || "A4"} {tpl.orientation || "LANDSCAPE"}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-brand-300 transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {tpl.designJson?.elements?.length || 0} visual elements &bull; In-memory PDF snapshot
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-800/80 mt-6 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready to Issue
                  </span>
                  <Link
                    href={`/coordinator/templates/${tpl.templateId}/designer`}
                    className="bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" /> Open Designer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
