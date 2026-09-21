import { NextRequest, NextResponse } from "next/server";
import { getEmailLogs } from "@/lib/email/logs";
import { getSmtpConfig } from "@/lib/email/service";

export async function GET(req: NextRequest) {
  try {
    const logs = getEmailLogs();
    const smtpConfig = getSmtpConfig();

    return NextResponse.json({
      activeSender: smtpConfig.fromEmail || smtpConfig.username || "info.rudvay@gmail.com",
      smtpHost: smtpConfig.host,
      isConfigured: Boolean(smtpConfig.username && smtpConfig.password),
      totalSent: logs.filter(l => l.status === "SENT").length,
      totalFailed: logs.filter(l => l.status === "FAILED").length,
      totalLogs: logs.length,
      logs
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to fetch email logs" }, { status: 500 });
  }
}
