import { NextResponse } from "next/server";

export async function GET() {
  const sampleLogs = [
    {
      action: "GENERATE_CERTIFICATE",
      targetType: "CERTIFICATE",
      targetId: "RT-2026-7K9P4X",
      actorRole: "COORDINATOR",
      actorUid: "coordinator-alpha",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    },
    {
      action: "CREATE_TEMPLATE",
      targetType: "TEMPLATE",
      targetId: "tpl_cyber_default",
      actorRole: "ADMIN",
      actorUid: "admin-root",
      timestamp: new Date(Date.now() - 3600000).toISOString().replace('T', ' ').substring(0, 19)
    }
  ];

  return NextResponse.json(sampleLogs);
}
