import fs from "fs";
import path from "path";
import { db } from "../firebase/client";
import { doc, setDoc } from "firebase/firestore";

export interface OutboundEmailLog {
  id: string;
  certificateId: string;
  recipientEmail: string;
  recipientName: string;
  courseName: string;
  status: "SENT" | "FAILED" | "PREPARED";
  senderEmail: string;
  timestamp: string;
  messageId?: string;
  errorMessage?: string;
}

const LOGS_FILE = path.join(process.cwd(), "email_logs.json");

const INITIAL_DEMO_LOGS: OutboundEmailLog[] = [
  {
    id: "email_demo_1",
    certificateId: "RT-2026-7K9P4X",
    recipientEmail: "alice.smith@example.com",
    recipientName: "Alice Smith",
    courseName: "Advanced Python & Cloud Security",
    status: "SENT",
    senderEmail: "info.rudvay@gmail.com",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    messageId: "<20260921.123456.info.rudvay@gmail.com>"
  }
];

function loadEmailLogsFromDisk(): OutboundEmailLog[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_DEMO_LOGS;
}

function saveEmailLogsToDisk(logs: OutboundEmailLog[]) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (e) {}
}

async function syncEmailLogToFirestore(log: OutboundEmailLog) {
  try {
    if (db && log.id) {
      await setDoc(doc(db, "emailLogs", log.id), {
        ...log
      }, { merge: true });
    }
  } catch (e) {
    console.warn("Firestore email log sync notice:", e);
  }
}

export function recordEmailLog(logData: Omit<OutboundEmailLog, "id" | "timestamp">): OutboundEmailLog {
  const currentLogs = loadEmailLogsFromDisk();
  const newLog: OutboundEmailLog = {
    ...logData,
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };

  currentLogs.unshift(newLog);
  saveEmailLogsToDisk(currentLogs);
  syncEmailLogToFirestore(newLog);

  return newLog;
}

export function getEmailLogs(): OutboundEmailLog[] {
  return loadEmailLogsFromDisk();
}
