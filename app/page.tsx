"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  Award, 
  Lock, 
  Zap, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { QRScannerModal } from "@/components/verification/qr-scanner-modal";

export default function HomePage() {
  const [certId, setCertId] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    let clean = certId.trim();
    if (clean.includes("/c/")) clean = clean.split("/c/")[1];
    clean = clean.split("?")[0];
    router.push(`/verify/${clean}`);
  };

  const handleScanSuccess = (scannedId: string) => {
    router.push(`/verify/${scannedId}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-center">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Background Gradients & Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-brand-500/30 text-xs font-semibold text-brand-300 mb-8 shadow-glow">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Official Rudvay Tech Verification Portal</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Cryptographically Secure <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-400 via-brand-200 to-gold-400 bg-clip-text text-transparent">
              Certificate Authority
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Verify the authenticity of official certifications issued by Rudvay Tech. 
            Instant validation via unique certificate ID or QR code.
          </p>

          {/* Search Verification Bar */}
          <div className="glass-panel p-3 rounded-2xl max-w-2xl mx-auto shadow-2xl border border-slate-700/80 mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Certificate ID (e.g. RT-2026-7K9P4X)"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                  title="Scan QR Code"
                >
                  <QrCode className="w-4 h-4 text-gold-400" />
                  <span className="hidden sm:inline">Scan QR</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 hover:from-brand-500 hover:to-brand-400 text-white px-7 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-glow transition-all hover:scale-[1.02]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify
                </button>
              </div>
            </form>
          </div>

          {/* Sample quick check */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <span>Try sample ID:</span>
            <button
              onClick={() => { setCertId("RT-2026-7K9P4X"); }}
              className="font-mono text-brand-400 hover:underline"
            >
              RT-2026-7K9P4X
            </button>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-2xl glass-panel-hover">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero Permanent Storage</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Certificates are generated strictly in-memory during dispatch and on-demand download. No permanent PDF files stored on disk.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl glass-panel-hover">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cryptographic Unique IDs</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Non-guessable random identifiers and secure QR verification links prevent certificate forgery and enumeration risks.
              </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl glass-panel-hover">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bulk Serverless Pipeline</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                High-capacity batch generator with Excel schema validation, chunked resumable workers, and automated SMTP delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
