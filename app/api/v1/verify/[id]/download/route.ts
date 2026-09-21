import { NextRequest, NextResponse } from "next/server";
import { getCert } from "@/lib/certificates/store";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import { getAppBaseUrl } from "@/lib/utils/url";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const cert = await getCert(id);

  if (!cert) {
    return NextResponse.json({ detail: "Certificate not found" }, { status: 404 });
  }

  const baseUrl = getAppBaseUrl(req);

  const pdfBytes = await generateCertificatePdf({
    certificateId: cert.certificateId,
    recipientName: cert.recipientName || "Participant",
    courseName: cert.courseName || "Certified Program",
    eventName: cert.eventName || cert.courseName,
    issueDate: cert.issueDate || new Date().toISOString().split("T")[0],
    duration: cert.duration || "20 Hours",
    templateId: cert.templateId,
    issuerName: cert.issuerName || "Rudvay Tech",
    verificationUrl: cert.verificationUrl || `${baseUrl}/verify/${cert.certificateId}`,
    rowData: cert.rowData
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Rudvay_Tech_Certificate_${cert.certificateId}.pdf"`
    }
  });
}
