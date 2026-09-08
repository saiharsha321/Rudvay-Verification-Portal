import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const globalJobs = (globalThis as any).__rudvay_bulk_jobs || {};
  const job = globalJobs[id];

  if (!job) {
    return NextResponse.json({ detail: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
