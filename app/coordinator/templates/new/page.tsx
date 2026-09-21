"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { CanvasEditor, TemplateDesignData } from "@/components/certificate-editor/canvas-editor";
import { ArrowLeft, Check, Sparkles, Wand2, Upload, FileImage } from "lucide-react";
import Link from "next/link";
import { 
  SAMPLE_TEMPLATE_CLASSIC_GOLD, 
  SAMPLE_TEMPLATE_MODERN_CYBER, 
  SAMPLE_TEMPLATE_TESTING1 
} from "@/lib/templates/default-templates";

import { uploadTemplateImageToCloudinary } from "@/lib/templates/cloudinary";

export default function NewTemplatePage() {
  const router = useRouter();
  const [templateName, setTemplateName] = useState("Custom Certificate Template");
  const [selectedDesign, setSelectedDesign] = useState<TemplateDesignData>(SAMPLE_TEMPLATE_TESTING1.designJson);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const bgInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    {
      id: "testing1",
      name: "testing1 (Test Sample)",
      desc: "Clean verified test layout with placeholders and QR",
      template: SAMPLE_TEMPLATE_TESTING1
    },
    {
      id: "classic_gold",
      name: "Classic Gold Honors",
      desc: "Formal Navy & Gold double border certificate",
      template: SAMPLE_TEMPLATE_CLASSIC_GOLD
    },
    {
      id: "modern_cyber",
      name: "Modern Cyber & Tech",
      desc: "Dark high-contrast cyan glowing certificate",
      template: SAMPLE_TEMPLATE_MODERN_CYBER
    }
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setTemplateName(preset.template.name);
    setSelectedDesign({ ...preset.template.designJson });
  };

  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    try {
      const imageUrl = await uploadTemplateImageToCloudinary(file);
      setTemplateName(fileNameWithoutExt || "My Custom Template");
      setSelectedDesign({
        width: 842,
        height: 595,
        backgroundColor: "#FFFFFF",
        backgroundImage: imageUrl,
        accentColor: "#2563EB",
        border: {
          style: "none",
          color: "#0B192C",
          width: 0,
          inset: 0
        },
        elements: [
          {
            id: "elem_name",
            type: "TEXT",
            x: 221,
            y: 220,
            width: 400,
            height: 45,
            content: "{{name}}",
            fontFamily: "Helvetica",
            fontSize: 28,
            fontWeight: "bold",
            alignment: "center",
            textColor: "#0B192C",
            strokeWidth: 1,
            opacity: 1,
            visibility: true
          },
          {
            id: "elem_qr",
            type: "QR",
            x: 670,
            y: 420,
            width: 90,
            height: 90,
            content: "{{verification_url}}",
            fontFamily: "Helvetica",
            fontSize: 12,
            fontWeight: "normal",
            alignment: "center",
            textColor: "#0B192C",
            strokeWidth: 1,
            opacity: 1,
            visibility: true
          }
        ]
      });
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
    }
    e.target.value = "";
  };

  const handleSave = async (design: TemplateDesignData) => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      await apiClient<any>("/templates", {
        method: "POST",
        body: JSON.stringify({
          name: templateName.trim() || "Certificate Template",
          pageSize: "A4",
          orientation: "LANDSCAPE",
          designJson: design
        })
      });
      setSuccessMsg("Template saved successfully! Redirecting to templates list...");
      setTimeout(() => {
        router.push("/coordinator/templates");
      }, 700);
    } catch (e: any) {
      alert("Failed to save template: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <input
          type="file"
          ref={bgInputRef}
          onChange={handleCustomImageUpload}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />

        {/* Header navigation & title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/coordinator/templates" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Templates
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Template Name:</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="bg-slate-900 border border-slate-700 hover:border-brand-500 focus:border-brand-500 rounded-lg px-3 py-1 text-sm font-bold text-white focus:outline-none transition-colors min-w-[240px]"
                placeholder="e.g. My Certificate Template"
              />
            </div>
          </div>

          {/* Presets & Custom Upload Button */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => bgInputRef.current?.click()}
              className="bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-glow transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Custom Template Image
            </button>

            <span className="text-xs text-slate-500 px-1 font-semibold">OR</span>

            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5 text-gold-400" /> Presets:
            </span>
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  templateName === p.template.name
                    ? "bg-brand-500/20 border-brand-500 text-brand-300 shadow-glow"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
                title={p.desc}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-pulse">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <CanvasEditor
          key={templateName}
          initialDesign={selectedDesign}
          templateName={templateName}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    </RoleGuard>
  );
}
