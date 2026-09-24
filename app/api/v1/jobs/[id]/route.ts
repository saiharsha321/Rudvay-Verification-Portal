import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const job = await getJob(id);
    if (job) {
      return NextResponse.json(job);
    }
  } catch (err: any) {
    console.warn("Job fetch notice:", err);
  }

  return NextResponse.json({ detail: "Job not found" }, { status: 404 });
}

