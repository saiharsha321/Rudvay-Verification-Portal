import { NextResponse } from "next/server";
import { getAllCerts } from "@/lib/certificates/store";

export async function GET() {
  const all = getAllCerts();
  const valid = all.filter(c => c.status === "VALID").length;
  const revoked = all.filter(c => c.status === "REVOKED").length;

  return NextResponse.json({
    totalCertificates: all.length,
    validCertificates: valid,
    revokedCertificates: revoked,
    totalCoordinators: 2,
    totalJobs: 1
  });
}
