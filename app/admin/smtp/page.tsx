"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/lib/auth/guards";
import { apiClient } from "@/lib/api/client";
import { 
  Mail, 
  Server, 
  Lock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Loader2,
  Sparkles
} from "lucide-react";

export default function AdminSmtpPage() {
  const [host, setHost] = useState("smtp.mailgun.org");
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState("postmaster@rudvaytech.com");
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState("Rudvay Tech Certifications");
  const [fromEmail, setFromEmail] = useState("certificates@rudvaytech.com");
  const [useTls, setUseTls] = useState(true);

  const [testEmail, setTestEmail] = useState("admin@rudvaytech.com");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setStatusMessage(null);

    try {
      const res = await apiClient<any>("/admin/smtp/test", {
        method: "POST",
        body: JSON.stringify({
          host,
          port: Number(port),
          username,
          password,
          fromEmail,
          useTls,
          recipientEmail: testEmail
        })
      });
      setStatusMessage({ type: "success", message: res.message || "SMTP handshake & authentication successful!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", message: err.message || "SMTP connection handshake failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await apiClient<any>("/admin/smtp/config", {
        method: "PUT",
        body: JSON.stringify({
          host,
          port: Number(port),
          username,
          password: password || undefined,
          fromName,
          fromEmail,
          useTls
        })
      });
      setStatusMessage({ type: "success", message: "SMTP configuration committed to secure systemSettings." });
    } catch (err: any) {
      setStatusMessage({ type: "error", message: err.message || "Failed to save SMTP configuration" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">SMTP Mail Server Settings</h1>
            <p className="text-xs text-slate-400">Configure outbound email delivery for automated PDF certificate dispatch</p>
          </div>
        </div>

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2 border ${
            statusMessage.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMessage.message}</span>
          </div>
        )}

        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">SMTP Host Server</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password / API Key</label>
              <input
                type="password"
                placeholder="•••••••••••• (Leave blank to keep current)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">From Sender Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">From Sender Email</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="tls-cb"
              checked={useTls}
              onChange={(e) => setUseTls(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700"
            />
            <label htmlFor="tls-cb" className="text-xs text-slate-300">
              Enable TLS/SSL encryption for secure transmission
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="test-recipient@rudvaytech.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white w-full sm:w-60"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 whitespace-nowrap disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test Handshake"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-glow disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
