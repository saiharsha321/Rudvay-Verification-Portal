"use client";

import React, { useState, useEffect } from "react";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { 
  FileCheck2, 
  Send, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function SingleCertificatePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState("20 Hours");
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const list = await apiClient<any[]>("/templates");
        setTemplates(list || []);
        if (list && list.length > 0) {
          setSelectedTemplateId(list[0].templateId);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadTemplates();
  }, []);

  const handlePreview = async () => {
    if (!name || !course) {
      setError("Please provide at least recipient name and course to preview");
      return;
    }
    setPreviewing(true);
    setError(null);
    try {
      const blob = await apiClient<Blob>("/certificates/preview", {
        method: "POST",
        body: JSON.stringify({
          name,
          email: email || "preview@rudvaytech.com",
          course,
          event: event || course,
          date,
          duration,
          templateId: selectedTemplateId,
          sendEmail: false
        })
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err: any) {
      setError(err.message || "Failed to generate preview");
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      setError("Please create or select a certificate template first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiClient<any>("/certificates/single", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          course,
          event: event || course,
          date,
          duration,
          templateId: selectedTemplateId,
          sendEmail
        })
      });

      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to issue certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["COORDINATOR", "ADMIN"]}>
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Issue Single Certificate</h1>
            <p className="text-xs text-slate-400">Manual recipient issuance with immediate in-memory email dispatch</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mb-8 p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-slate-200">
            <div className="flex items-center gap-3 text-emerald-400 font-bold mb-2">
              <CheckCircle2 className="w-5 h-5" /> Certificate Successfully Generated & Issued!
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Cryptographic ID assigned: <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded">{result.certificateId}</span>
            </p>
            <div className="flex gap-3">
              <Link
                href={`/verify/${result.certificateId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Public Verification
              </Link>
            </div>
          </div>
        )}

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Recipient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Recipient Email *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Course / Program *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Python Security"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Event / Workshop Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Tech Summit 2026"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Issue Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Duration / Hours</label>
                <input
                  type="text"
                  placeholder="e.g. 24 Hours / 4 Weeks"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Certificate Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {templates.map(t => (
                  <option key={t.templateId} value={t.templateId}>{t.name} (v{t.currentVersion})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="send-email-cb"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700"
              />
              <label htmlFor="send-email-cb" className="text-xs text-slate-300">
                Automatically dispatch certificate PDF attachment via SMTP email
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
              >
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 text-brand-400" />}
                Live In-Memory Preview
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-7 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-glow transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Issue & Send Certificate
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
