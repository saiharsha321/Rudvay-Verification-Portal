import { NextRequest, NextResponse } from "next/server";
import { saveSmtpConfig, getSmtpConfig } from "@/lib/email/service";

export async function GET() {
  const config = await getSmtpConfig();
  // Don't expose plain text password
  return NextResponse.json({
    ...config,
    password: config.password ? "••••••••••••" : ""
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await saveSmtpConfig(body);
    return NextResponse.json({
      success: true,
      message: "SMTP configuration updated successfully",
      config: {
        host: updated.host,
        port: updated.port,
        username: updated.username,
        fromName: updated.fromName,
        fromEmail: updated.fromEmail,
        useTls: updated.useTls
      }
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to update SMTP config" }, { status: 500 });
  }
}
