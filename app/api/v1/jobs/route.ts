import { NextRequest, NextResponse } from "next/server";
import { getAllJobs } from "@/lib/jobs/store";

export async function GET(req: NextRequest) {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json(jobs);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to fetch jobs list" }, { status: 500 });
  }
}
