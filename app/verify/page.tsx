"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, QrCode, Sparkles } from "lucide-react";
import { QRScannerModal } from "@/components/verification/qr-scanner-modal";

export default function VerifySearchPage() {
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-16">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-brand-500/30 text-xs font-semibold text-brand-300 mb-6 shadow-glow">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
          <span>Certificate Verification Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Verify Certificate
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Enter the unique Certificate ID found on the certificate or scan the official QR code.
        </p>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-2xl mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. RT-2026-7K9P4X"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-500 text-base font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <QrCode className="w-4 h-4 text-gold-400" />
                Scan QR Code
              </button>
              <button
                type="submit"
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-glow transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                Verify ID
              </button>
            </div>
          </form>
        </div>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(id) => router.push(`/verify/${id}`)}
      />
    </div>
  );
}
