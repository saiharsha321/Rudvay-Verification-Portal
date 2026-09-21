import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    if (db) {
      const snap = await getDoc(doc(db, "generationJobs", id));
      if (snap.exists()) {
        return NextResponse.json(snap.data());
      }
    }
  } catch (err: any) {
    console.warn("Firestore job fetch notice:", err);
  }

  return NextResponse.json({ detail: "Job not found" }, { status: 404 });
}
