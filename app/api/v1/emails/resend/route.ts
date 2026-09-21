import { NextRequest, NextResponse } from "next/server";
import { getCert } from "@/lib/certificates/store";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import { sendCertificateEmail } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const certificateId = body.certificateId;
    const recipientEmail = body.recipientEmail;

    if (!certificateId) {
      return NextResponse.json({ detail: "Certificate ID is required" }, { status: 400 });
    }

    const cert = await getCert(certificateId);
    if (!cert) {
      return NextResponse.json({ detail: "Certificate not found" }, { status: 404 });
    }

    const targetEmail = recipientEmail || cert.recipientEmail;
    if (!targetEmail) {
      return NextResponse.json({ detail: "Recipient email is missing" }, { status: 400 });
    }

    const pdfBytes = await generateCertificatePdf({
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      courseName: cert.courseName,
      eventName: cert.eventName,
      issueDate: cert.issueDate,
      duration: cert.duration,
      templateId: cert.templateId,
      issuerName: cert.issuerName,
      verificationUrl: cert.verificationUrl
    });

    const emailRes = await sendCertificateEmail({
      toEmail: targetEmail,
      recipientName: cert.recipientName,
      courseName: cert.courseName,
      certificateId: cert.certificateId,
      pdfBuffer: pdfBytes,
      verificationUrl: cert.verificationUrl
    });

    return NextResponse.json({
      success: emailRes.success,
      message: emailRes.message,
      messageId: emailRes.messageId,
      recipientEmail: targetEmail
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to resend email" }, { status: 500 });
  }
}
