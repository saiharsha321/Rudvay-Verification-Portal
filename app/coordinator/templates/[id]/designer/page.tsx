"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { CanvasEditor, TemplateDesignData } from "@/components/certificate-editor/canvas-editor";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { SAMPLE_TEMPLATE_TESTING1 } from "@/lib/templates/default-templates";

export default function EditTemplateDesignerPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.id as string;

  const [template, setTemplate] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [design, setDesign] = useState<TemplateDesignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
    const fetchTemplate = async () => {
      try {
        const res = await apiClient<any>(`/templates/${templateId}`);
        setTemplate(res);
        setTemplateName(res.name);
        setDesign(res.designJson || SAMPLE_TEMPLATE_TESTING1.designJson);
      } catch (e) {
        console.error("Failed to load template", e);
        // Fallback for testing1 or sample templates
        if (templateId === "tpl_testing1") {
          setTemplate(SAMPLE_TEMPLATE_TESTING1);
          setTemplateName(SAMPLE_TEMPLATE_TESTING1.name);
          setDesign(SAMPLE_TEMPLATE_TESTING1.designJson);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId]);

  const handleSave = async (updatedDesign: TemplateDesignData) => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      await apiClient<any>(`/templates/${templateId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: templateName.trim() || "Certificate Template",
          designJson: updatedDesign,
          publishNewVersion: true
        })
      });
      setSuccessMsg("New template version published successfully! Redirecting...");
      setTimeout(() => {
        router.push("/coordinator/templates");
      }, 700);
    } catch (e: any) {
      alert("Failed to update template: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
        <p className="text-xs">Loading template studio...</p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/coordinator/templates" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Templates
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-slate-900 border border-slate-700 hover:border-brand-500 focus:border-brand-500 rounded-lg px-3 py-1 text-base font-bold text-white focus:outline-none transition-colors min-w-[240px]"
            placeholder="Template Name"
          />
          <span className="text-xs font-mono text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-md">
            Current Version: v{template?.currentVersion || 1}
          </span>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-pulse">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {design && (
          <CanvasEditor
            initialDesign={design}
            templateName={templateName}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
    </RoleGuard>
  );
}
