import fs from "fs";
import path from "path";

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
  },
  "RT-2026-REVOKED": {
    certificateId: "RT-2026-REVOKED",
    status: "REVOKED",
    recipientName: "Malicious / Incomplete Entry",
    recipientEmail: "revoked@example.com",
    courseName: "Python Cybersecurity Workshop",
    eventName: "Cyber Tech Summit 2026",
    issueDate: "2026-09-08",
    duration: "20 Hours",
    issuerName: "Rudvay Tech",
    revocationReason: "Disciplinary requirement violation",
    verificationUrl: "http://localhost:3000/verify/RT-2026-REVOKED"
  }
};

// Global in-memory cache to prevent resets on hot-reloading
const globalStore = (globalThis as any).__rudvay_certs_store || { ...DEFAULT_CERTS };
(globalThis as any).__rudvay_certs_store = globalStore;

const STORAGE_FILE = path.join(process.cwd(), "certificates_data.json");

function loadFromDisk(): Record<string, CertRecord> {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CERTS, ...globalStore, ...parsed };
    }
  } catch (e) {
    // Ignore error
  }
  return { ...DEFAULT_CERTS, ...globalStore };
}

function saveToDisk(store: Record<string, CertRecord>) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    // Ignore error
  }
}

export function getCert(id: string): CertRecord | undefined {
  if (!id) return undefined;
  const normalizedId = id.trim().toUpperCase();
  
  // Try memory first
  if (globalStore[normalizedId]) {
    return globalStore[normalizedId];
  }
  if (globalStore[id]) {
    return globalStore[id];
  }
  
  // Check disk
  const disk = loadFromDisk();
  if (disk[normalizedId]) {
    globalStore[normalizedId] = disk[normalizedId];
    return disk[normalizedId];
  }
  if (disk[id]) {
    globalStore[id] = disk[id];
    return disk[id];
  }

  return undefined;
}

export function saveCert(cert: CertRecord): CertRecord {
  const normalizedId = cert.certificateId.trim().toUpperCase();
  const fullCert = { ...cert, certificateId: normalizedId };
  
  globalStore[normalizedId] = fullCert;
  (globalThis as any).__rudvay_certs_store = globalStore;

  const disk = loadFromDisk();
  disk[normalizedId] = fullCert;
  saveToDisk(disk);

  return fullCert;
}

export function revokeCert(id: string, reason: string): CertRecord | null {
  const normalizedId = id.trim().toUpperCase();
  const existing = getCert(normalizedId);
  if (!existing) return null;

  const updated: CertRecord = {
    ...existing,
    status: "REVOKED",
    revocationReason: reason || "Revoked by Administrator"
  };

  saveCert(updated);
  return updated;
}

export function getAllCerts(): CertRecord[] {
  const disk = loadFromDisk();
  return Object.values(disk);
}

export const certsStore = globalStore;
