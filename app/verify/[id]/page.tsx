"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CertificateBadge, PublicCertData } from "@/components/verification/certificate-badge";
import { apiClient } from "@/lib/api/client";

export default function CertificateResultPage() {
  const params = useParams();
  const rawId = params?.id as string;
  
  const [data, setData] = useState<PublicCertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawId) return;

    const fetchVerification = async () => {
      setLoading(true);
      setError(null);
      try {
        const certData = await apiClient<PublicCertData>(`/verify/${encodeURIComponent(rawId)}`, {
          requireAuth: false
        });
        setData(certData);
      } catch (err: any) {
        setError(err.message || "Certificate with this ID was not found in our registry.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [rawId]);

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
      <div className="mb-6">
        <Link 
          href="/verify" 
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Verification Search
        </Link>
      </div>

      <CertificateBadge 
        data={data} 
        loading={loading} 
        error={error} 
      />
    </div>
  );
}
