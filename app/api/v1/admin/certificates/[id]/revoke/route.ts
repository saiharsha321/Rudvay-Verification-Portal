import { NextRequest, NextResponse } from "next/server";
import { revokeCert } from "@/lib/certificates/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Disciplinary requirement violation";

    const updated = revokeCert(id, reason);
    if (!updated) {
      return NextResponse.json({ detail: `Certificate '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      certificateId: updated.certificateId,
      status: "REVOKED",
      revocationReason: reason,
      message: `Certificate ${updated.certificateId} has been revoked successfully`
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to revoke certificate" }, { status: 500 });
  }
}
