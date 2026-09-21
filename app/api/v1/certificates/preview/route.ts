import { NextRequest, NextResponse } from "next/server";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import { getAppBaseUrl } from "@/lib/utils/url";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const recipientName = body.name || "Preview Recipient";
    const courseName = body.course || "Technical Workshop Program";
    const eventName = body.event || courseName;
    const issueDate = body.date || new Date().toISOString().split("T")[0];
    const duration = body.duration || "20 Hours";
    const templateId = body.templateId || "tpl_classic_gold";
    const certificateId = "RT-2026-PREVIEW";
    const baseUrl = getAppBaseUrl(req);

    const pdfBytes = await generateCertificatePdf({
      certificateId,
      recipientName,
      courseName,
      eventName,
      issueDate,
      duration,
      templateId,
      issuerName: "Rudvay Tech",
      verificationUrl: `${baseUrl}/verify/${certificateId}`,
      rowData: body.rowData || body
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=certificate_preview.pdf"
      }
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to generate preview" }, { status: 500 });
  }
}
