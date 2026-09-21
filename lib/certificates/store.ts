import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

export interface CertRecord {
  certificateId: string;
  status: "VALID" | "REVOKED";
  recipientName: string;
  recipientEmail?: string;
  courseName: string;
  eventName?: string;
  issueDate: string;
  duration?: string;
  templateId?: string;
  issuerName?: string;
  revocationReason?: string;
  verificationUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_CERTS: Record<string, CertRecord> = {
  "RT-2026-7K9P4X": {
    certificateId: "RT-2026-7K9P4X",
    status: "VALID",
    recipientName: "Alice Smith",
    recipientEmail: "alice.smith@example.com",
    courseName: "Advanced Python & Cloud Security",
    eventName: "Cyber Tech Summit 2026",
    issueDate: "2026-09-08",
    duration: "24 Hours",
    issuerName: "Rudvay Tech",
    verificationUrl: "http://localhost:3000/verify/RT-2026-7K9P4X"
  },
  "RT-2026-9A8B7C": {
    certificateId: "RT-2026-9A8B7C",
    status: "VALID",
    recipientName: "Johnathan Doe",
    recipientEmail: "johnathan.doe@example.com",
    courseName: "Enterprise DevSecOps Architecture",
    eventName: "DevOps Global Summit",
    issueDate: "2026-09-08",
    duration: "30 Hours",
    issuerName: "Rudvay Tech",
    verificationUrl: "http://localhost:3000/verify/RT-2026-9A8B7C"
  }
};

export async function getCert(id: string): Promise<CertRecord | undefined> {
  if (!id) return undefined;
  const normalizedId = id.trim().toUpperCase();

  try {
    if (db) {
      const snap = await getDoc(doc(db, "certificates", normalizedId));
      if (snap.exists()) {
        return snap.data() as CertRecord;
      }
    }
  } catch (err) {
    console.warn("Firestore cert fetch notice:", err);
  }

  return DEFAULT_CERTS[normalizedId];
}

export async function saveCert(cert: CertRecord): Promise<CertRecord> {
  const normalizedId = cert.certificateId.trim().toUpperCase();
  const fullCert: CertRecord = {
    ...cert,
    certificateId: normalizedId,
    updatedAt: new Date().toISOString()
  };

  try {
    if (db) {
      await setDoc(doc(db, "certificates", normalizedId), fullCert, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save certificate to Firestore:", err);
  }

  return fullCert;
}

export async function revokeCert(id: string, reason: string): Promise<CertRecord | null> {
  const normalizedId = id.trim().toUpperCase();
  const existing = await getCert(normalizedId);
  if (!existing) return null;

  const updated: CertRecord = {
    ...existing,
    status: "REVOKED",
    revocationReason: reason || "Revoked by Administrator",
    updatedAt: new Date().toISOString()
  };

  await saveCert(updated);
  return updated;
}

export async function getAllCerts(): Promise<CertRecord[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "certificates"));
      const docsList = snap.docs.map(d => d.data() as CertRecord);
      if (docsList.length > 0) {
        return docsList;
      }
    }
  } catch (err) {
    console.warn("Firestore getAllCerts notice:", err);
  }
  return Object.values(DEFAULT_CERTS);
}
