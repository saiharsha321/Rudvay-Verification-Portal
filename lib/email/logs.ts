import { db } from "../firebase/client";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";

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

export async function recordEmailLog(logData: Omit<OutboundEmailLog, "id" | "timestamp">): Promise<OutboundEmailLog> {
  const newId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newLog: OutboundEmailLog = {
    ...logData,
    id: newId,
    timestamp: new Date().toISOString()
  };

  try {
    if (db) {
      await setDoc(doc(db, "emailLogs", newId), newLog, { merge: true });
    }
  } catch (e: any) {
    if (e?.code === "permission-denied") {
      console.warn("[Firestore Notice] Email log save skipped due to Firestore Security Rules. Update rules in Firebase Console.");
    } else {
      console.warn("Firestore email log notice:", e?.message || e);
    }
  }

  return newLog;
}

export async function getEmailLogs(): Promise<OutboundEmailLog[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "emailLogs"));
      const docsList = snap.docs.map(d => d.data() as OutboundEmailLog);
      if (docsList.length > 0) {
        return docsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }
  } catch (e: any) {
    if (e?.code === "permission-denied") {
      console.warn("[Firestore Notice] Firestore Security Rules currently restrict reading emailLogs.");
    } else {
      console.warn("Firestore getEmailLogs notice:", e?.message || e);
    }
  }
  return INITIAL_DEMO_LOGS;
}
