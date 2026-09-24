"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Download, 
  Printer, 
  Calendar, 
  BookOpen, 
  Award, 
  Building2,
  Loader2,
  QrCode
} from "lucide-react";
import QRCode from "qrcode";
import { sanitizeVerificationUrl } from "@/lib/utils/url";

export interface PublicCertData {
  certificateId: string;
  recipientName: string;
  programName?: string;
  courseName?: string;
  eventName?: string;
  issueDate: string;
  duration?: string;
  status: "VALID" | "REVOKED" | "EXPIRED" | string;
  issuer?: string;
  issuerName?: string;
  revocationReason?: string;
  verificationUrl?: string;
}

interface CertificateBadgeProps {
  data: PublicCertData | null;
  loading?: boolean;
  error?: string | null;
}

export const CertificateBadge: React.FC<CertificateBadgeProps> = ({ data, loading, error }) => {
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const verifyUrl = sanitizeVerificationUrl(data?.verificationUrl, data?.certificateId);

  useEffect(() => {
    if (verifyUrl) {
      QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 180,
        color: {
          dark: "#0284c7",
          light: "#ffffff"
        }
      }).then(url => setQrDataUrl(url)).catch(() => {});
    }
  }, [verifyUrl]);

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center max-w-2xl mx-auto border border-brand-500/30">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Cryptographic Verification in Progress</h3>
        <p className="text-slate-400 text-sm">Querying immutable records in Rudvay Tech Certificate Registry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center max-w-2xl mx-auto border border-red-500/30 bg-red-950/20">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-red-400 mb-2">Certificate Not Verified</h3>
        <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
          {error || "The provided certificate identifier could not be located in our official verification registry or has invalid signatures."}
        </p>
        <div className="text-xs text-slate-500 font-mono">
          Status: RECORD_NOT_FOUND
        </div>
      </div>
    );
  }

  const isValid = data.status === "VALID";
  const isRevoked = data.status === "REVOKED";
  const displayProgram = data.programName || data.courseName || "Certified Workshop";
  const displayIssuer = data.issuer || data.issuerName || "Rudvay Tech";

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/v1/verify/${encodeURIComponent(data.certificateId)}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Rudvay_Tech_Certificate_${data.certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      // If server download is not available, fallback to browser print dialog
      window.print();
    } catch (e) {
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`glass-panel rounded-2xl p-6 sm:p-10 max-w-3xl mx-auto border transition-all ${
      isValid 
        ? "border-emerald-500/40 bg-slate-900/90 shadow-2xl shadow-emerald-500/10" 
        : "border-red-500/40 bg-red-950/20 shadow-2xl shadow-red-500/10"
    }`}>
      {/* Verification Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
            isValid 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {isValid ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isValid 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {data.status}
              </span>
              <span className="text-xs text-slate-500 font-mono">Official Registry</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              {isValid ? "Certificate Verified Authentic" : "Certificate Revoked"}
            </h2>
            {isRevoked && data.revocationReason && (
              <p className="text-xs text-red-300/80 mt-1 font-mono">
                Reason: {data.revocationReason}
              </p>
            )}
          </div>
        </div>

        {/* Certificate ID Pill */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 sm:text-right">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Certificate ID</div>
          <div className="font-mono text-base font-bold text-brand-400">{data.certificateId}</div>
        </div>
      </div>

      {/* Verified Details Grid & QR Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Award className="w-4 h-4 text-gold-400" />
              Recipient Name
            </div>
            <div className="text-base font-bold text-white">{data.recipientName}</div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <BookOpen className="w-4 h-4 text-brand-400" />
              Course / Program
            </div>
            <div className="text-base font-bold text-white">{displayProgram}</div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Calendar className="w-4 h-4 text-slate-400" />
              Issue Date
            </div>
            <div className="text-sm font-semibold text-slate-200">{data.issueDate}</div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
              <Building2 className="w-4 h-4 text-slate-400" />
              Issuing Authority
            </div>
            <div className="text-sm font-semibold text-slate-200">{displayIssuer}</div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <div className="text-xs text-slate-400 flex items-center gap-1 mb-2 font-medium">
            <QrCode className="w-3.5 h-3.5 text-brand-400" />
            Official QR Code
          </div>
          {qrDataUrl ? (
            <div className="p-1.5 bg-white rounded-lg shadow-md mb-2">
              <img src={qrDataUrl} alt="Certificate Verification QR Code" className="w-24 h-24" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-600 mb-2">
              <QrCode className="w-8 h-8 animate-pulse" />
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-mono">Scan with camera to verify</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
        <div className="text-xs text-slate-500">
          Cryptographically signed &bull; Non-permanent zero-storage verification
        </div>

        {isValid && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow hover:shadow-brand-500/30 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Regenerating PDF..." : "Download Official PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
