import { NextRequest, NextResponse } from "next/server";
import { saveCert, CertRecord } from "@/lib/certificates/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const globalJobs = (globalThis as any).__rudvay_bulk_jobs || {};
    const job = globalJobs[id];

    if (!job) {
      return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const chunkSize = parseInt(searchParams.get("chunk_size") || "25", 10);

    const pendingItems = job.items.filter((it: any) => it.status === "PENDING");
    const toProcess = pendingItems.slice(0, chunkSize);

    for (const item of toProcess) {
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
      saveCert(newCert);
      item.status = "COMPLETED";
      job.processedCount += 1;
      job.successCount += 1;
    }

    if (job.processedCount >= job.totalRecords) {
      job.status = "COMPLETED";
    } else {
      job.status = "PROCESSING";
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
