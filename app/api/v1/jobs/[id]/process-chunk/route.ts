import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { saveCert, CertRecord } from "@/lib/certificates/store";
import { generateCertificatePdf } from "@/lib/certificates/pdf-generator";
import { sendCertificateEmail } from "@/lib/email/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    let job: any = null;

    if (db) {
      const snap = await getDoc(doc(db, "generationJobs", id));
      if (snap.exists()) {
        job = snap.data();
      }
    }

    if (!job) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const chunkSize = parseInt(searchParams.get("chunk_size") || "25", 10);

    const items = job.items || [];
    const pendingItems = items.filter((it: any) => it.status === "PENDING");
    const toProcess = pendingItems.slice(0, chunkSize);

    for (const item of toProcess) {
      try {
        const newCert: CertRecord = {
          certificateId: item.certificateId,
          status: "VALID",
          recipientName: item.recipientName,
          recipientEmail: item.recipientEmail,
          courseName: item.courseName,
          eventName: item.eventName,
          issueDate: item.issueDate,
          duration: item.duration,
          templateId: job.templateId,
          issuerName: "Rudvay Tech",
          verificationUrl: `http://localhost:3000/verify/${item.certificateId}`
        };
        await saveCert(newCert);

        // Generate PDF and send email automatically if recipientEmail is provided
        if (item.recipientEmail) {
          try {
            const pdfBytes = await generateCertificatePdf({
              certificateId: item.certificateId,
              recipientName: item.recipientName,
              courseName: item.courseName,
              eventName: item.eventName,
              issueDate: item.issueDate,
              duration: item.duration,
              templateId: job.templateId,
              issuerName: "Rudvay Tech",
              verificationUrl: newCert.verificationUrl
            });

            await sendCertificateEmail({
              toEmail: item.recipientEmail,
              recipientName: item.recipientName,
              courseName: item.courseName,
              certificateId: item.certificateId,
              pdfBuffer: pdfBytes,
              verificationUrl: newCert.verificationUrl
            });
          } catch (emailErr: any) {
            console.warn(`[Bulk Email Warning] Failed to send email for ${item.certificateId}:`, emailErr.message);
          }
        }

        item.status = "COMPLETED";
        job.processedCount = (job.processedCount || 0) + 1;
        job.successCount = (job.successCount || 0) + 1;
      } catch (itemErr: any) {
        item.status = "FAILED";
        item.errorMessage = itemErr.message;
        job.processedCount = (job.processedCount || 0) + 1;
        job.failedCount = (job.failedCount || 0) + 1;
      }
    }

    if (job.processedCount >= job.totalRecords) {
      job.status = "COMPLETED";
    } else {
      job.status = "PROCESSING";
    }

    if (db) {
      await setDoc(doc(db, "generationJobs", id), job, { merge: true });
    }

    return NextResponse.json({
      jobId: id,
      processedInChunk: toProcess.length,
      totalProcessed: job.processedCount,
      totalRecords: job.totalRecords,
      status: job.status,
      isFinished: job.status === "COMPLETED"
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to process job chunk" }, { status: 500 });
  }
}
