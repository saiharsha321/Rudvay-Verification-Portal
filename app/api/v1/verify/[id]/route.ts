import { NextRequest, NextResponse } from "next/server";
import { getCert } from "@/lib/certificates/store";
import { sanitizeVerificationUrl } from "@/lib/utils/url";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const cert = await getCert(id);

  if (!cert) {
    return NextResponse.json({ detail: `Certificate with ID '${id}' was not found in our registry.` }, { status: 404 });
  }

  const cleanVerifyUrl = sanitizeVerificationUrl(cert.verificationUrl, cert.certificateId, req);

  if (cert.status === "REVOKED") {
    return NextResponse.json({
      certificateId: cert.certificateId,
      status: "REVOKED",
      recipientName: cert.recipientName,
      programName: cert.courseName,
      courseName: cert.courseName,
      eventName: cert.eventName || cert.courseName,
      issueDate: cert.issueDate,
      duration: cert.duration || "20 Hours",
      issuer: cert.issuerName || "Rudvay Tech",
      issuerName: cert.issuerName || "Rudvay Tech",
      revocationReason: cert.revocationReason || "Revoked by Administrator",
      verificationUrl: cleanVerifyUrl
    }, { status: 410 });
  }

  return NextResponse.json({
    certificateId: cert.certificateId,
    status: "VALID",
    recipientName: cert.recipientName,
    programName: cert.courseName,
    courseName: cert.courseName,
    eventName: cert.eventName || cert.courseName,
    issueDate: cert.issueDate,
    duration: cert.duration || "20 Hours",
    issuer: cert.issuerName || "Rudvay Tech",
    issuerName: cert.issuerName || "Rudvay Tech",
    verificationUrl: cleanVerifyUrl
  });
}

