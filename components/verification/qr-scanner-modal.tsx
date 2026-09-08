"use client";

import React, { useState } from "react";
import { X, Camera, Upload, AlertCircle, ScanLine } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (certificateId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError("Please enter a valid certificate ID or QR link");
      return;
    }

    // Extract certificate ID if full URL was pasted: https://verify.rudvaytech.com/c/RT-2026-XXXXXX
    let cleanId = manualCode.trim();
    if (cleanId.includes("/c/")) {
      cleanId = cleanId.split("/c/")[1];
    } else if (cleanId.includes("/verify/")) {
      cleanId = cleanId.split("/verify/")[1];
    }
    cleanId = cleanId.split("?")[0].trim();

    onScanSuccess(cleanId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Scan Certificate QR</h3>
            <p className="text-xs text-slate-400">Scan camera QR code or paste verification string</p>
          </div>
        </div>

        {/* Scan / Visual Viewport */}
        <div className="border-2 border-dashed border-brand-500/40 rounded-xl bg-slate-950/70 p-8 text-center relative overflow-hidden mb-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-brand-400 animate-pulse">
            <Camera className="w-10 h-10" />
          </div>
          <p className="text-sm font-semibold text-slate-200 mb-1">Point device camera at QR Code</p>
          <p className="text-xs text-slate-400">Position the official Rudvay Tech QR code within viewfinder</p>
        </div>

        {/* Quick Paste Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="text-xs font-medium text-slate-300">Or Paste Scanned QR URL / ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. RT-2026-7K9P4X or https://verify.../c/RT-2026-7K9P4X"
              value={manualCode}
              onChange={(e) => { setManualCode(e.target.value); setError(null); }}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Verify
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
