import { NextRequest, NextResponse } from "next/server";
import { testSmtp } from "@/lib/email/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { host, port, username, password, fromName, fromEmail, useTls, recipientEmail } = body;

    const res = await testSmtp({
      host,
      port: Number(port) || 587,
      username,
      password,
      fromName: fromName || "Rudvay Tech Certifications",
      fromEmail: fromEmail || username,
      useTls: !!useTls
    }, recipientEmail || username);

    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "SMTP connection handshake failed" }, { status: 400 });
  }
}
