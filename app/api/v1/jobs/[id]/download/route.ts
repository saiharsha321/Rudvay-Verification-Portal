import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/store";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import { getAppBaseUrl } from "@/lib/utils/url";
import { PDFDocument } from "pdf-lib";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const job = await getJob(id);

    if (!job) {
      return NextResponse.json({ detail: "Generation job not found" }, { status: 404 });
    }

    const items = job.items || [];
    if (items.length === 0) {
      return NextResponse.json({ detail: "No certificate items in this batch job" }, { status: 400 });
    }

    const baseUrl = getAppBaseUrl(req);
    const mergedPdf = await PDFDocument.create();

    for (const item of items) {
      const certId = item.certificateId;
      const verificationUrl = `${baseUrl}/verify/${certId}`;

      const certPdfBytes = await generateCertificatePdf({
        certificateId: certId,
        recipientName: item.recipientName || "Participant",
        courseName: item.courseName || job.eventName,
        eventName: item.eventName || job.eventName,
        issueDate: item.issueDate || new Date().toISOString().split("T")[0],
        duration: item.duration || "20 Hours",
        templateId: job.templateId,
        issuerName: "Rudvay Tech",
        verificationUrl,
        rowData: item.rowData
      });

      const singlePdf = await PDFDocument.load(certPdfBytes);
      const copiedPages = await mergedPdf.copyPages(singlePdf, singlePdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const cleanEventName = (job.eventName || "Batch").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Rudvay_Certificates_${cleanEventName}_${job.jobId}.pdf`;

    return new NextResponse(Buffer.from(mergedBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (err: any) {
    console.error("Failed to generate batch combined PDF:", err);
    return NextResponse.json({ detail: err.message || "Failed to generate batch PDF" }, { status: 500 });
  }
}
