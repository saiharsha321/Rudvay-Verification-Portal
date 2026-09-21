import { NextRequest, NextResponse } from "next/server";
import { saveCert, CertRecord } from "@/lib/certificates/store";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import { sendCertificateEmail } from "@/lib/email/service";
import { getAppBaseUrl } from "@/lib/utils/url";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const certId = `RT-${new Date().getFullYear()}-${rand}`;
    const baseUrl = getAppBaseUrl(req);
    const verificationUrl = `${baseUrl}/verify/${certId}`;

    const newCert: CertRecord = {
      certificateId: certId,
      status: "VALID",
      recipientName: body.name || "Participant",
      recipientEmail: body.email || "",
      courseName: body.course || "Certified Program",
      eventName: body.event || body.course || "Technical Workshop",
      issueDate: body.date || new Date().toISOString().split("T")[0],
      duration: body.duration || "20 Hours",
      templateId: body.templateId || "tpl_classic_gold",
      issuerName: "Rudvay Tech",
      verificationUrl,
      rowData: body
    };

    await saveCert(newCert);

    // If sendEmail is enabled, generate PDF and dispatch email
    let emailStatus = { success: false, message: "Email dispatch not requested" };
    if (body.sendEmail && body.email) {
      try {
        const pdfBytes = await generateCertificatePdf({
          certificateId: certId,
          recipientName: newCert.recipientName,
          courseName: newCert.courseName,
          eventName: newCert.eventName,
          issueDate: newCert.issueDate,
          duration: newCert.duration,
          templateId: newCert.templateId,
          issuerName: newCert.issuerName,
          verificationUrl: newCert.verificationUrl,
          rowData: body
        });

        emailStatus = await sendCertificateEmail({
          toEmail: body.email,
          recipientName: newCert.recipientName,
          courseName: newCert.courseName,
          certificateId: certId,
          pdfBuffer: pdfBytes,
          verificationUrl: newCert.verificationUrl
        });
      } catch (err: any) {
        console.warn("Failed to dispatch certificate email:", err.message);
        emailStatus = { success: false, message: err.message };
      }
    }

    return NextResponse.json({
      success: true,
      certificateId: certId,
      message: "Certificate issued successfully",
      recipientName: newCert.recipientName,
      course: newCert.courseName,
      verificationUrl: newCert.verificationUrl,
      emailDispatch: emailStatus
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to issue certificate" }, { status: 500 });
  }
}
