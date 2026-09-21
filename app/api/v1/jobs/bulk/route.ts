import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client";
import { doc, setDoc } from "firebase/firestore";

export interface BulkJobItem {
  itemId: string;
  jobId: string;
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  eventName: string;
  issueDate: string;
  duration: string;
  certificateId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  rowData?: Record<string, any>;
}

export interface BulkJob {
  jobId: string;
  eventId: string;
  eventName: string;
  templateId: string;
  templateVersion: number;
  totalRecords: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  items: BulkJobItem[];
  createdAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const validRows = body.validRows || [];

    const items: BulkJobItem[] = validRows.map((row: any, idx: number) => {
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      let rand = "";
      for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
      const certId = `RT-${new Date().getFullYear()}-${rand}`;

      return {
        itemId: `item_${jobId}_${idx}`,
        jobId,
        recipientName: row.name,
        recipientEmail: row.email,
        courseName: row.course,
        eventName: body.eventName || row.course,
        issueDate: row.date || new Date().toISOString().split("T")[0],
        duration: row.duration || "20 Hours",
        certificateId: certId,
        status: "PENDING",
        rowData: row
      };
    });

    const newJob: BulkJob = {
      jobId,
      eventId: body.eventId || "",
      eventName: body.eventName || "Bulk Issuance",
      templateId: body.templateId || "tpl_default",
      templateVersion: body.templateVersion || 1,
      totalRecords: items.length,
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      status: "QUEUED",
      items,
      createdAt: new Date().toISOString()
    };

    if (db) {
      await setDoc(doc(db, "generationJobs", jobId), newJob, { merge: true });
    }

    return NextResponse.json({
      jobId,
      totalRecords: items.length,
      status: "QUEUED",
      message: "Bulk generation job successfully queued"
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to create bulk generation job" }, { status: 500 });
  }
}
