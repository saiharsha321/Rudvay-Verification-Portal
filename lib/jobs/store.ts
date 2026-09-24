import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from "firebase/firestore";
import fs from "fs";
import path from "path";

export interface BulkJobItem {
  itemId: string;
  jobId: string;
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  eventName: string;
  issueDate: string;
  duration: string;
  certificateId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  errorMessage?: string;
  rowData?: Record<string, any>;
}

export interface BulkJob {
  jobId: string;
  eventId: string;
  eventName: string;
  templateId: string;
  templateVersion: number;
  totalRecords: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  items: BulkJobItem[];
  createdAt: string;
  updatedAt?: string;
}

const LOCAL_JOBS_FILE = path.join(process.cwd(), "jobs_data.json");

function readLocalJobs(): Record<string, BulkJob> {
  try {
    if (fs.existsSync(LOCAL_JOBS_FILE)) {
      const raw = fs.readFileSync(LOCAL_JOBS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Notice: Failed to read local jobs_data.json", e);
  }
  return {};
}

function writeLocalJobs(jobs: Record<string, BulkJob>) {
  try {
    fs.writeFileSync(LOCAL_JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
  } catch (e) {
    console.warn("Notice: Failed to write local jobs_data.json", e);
  }
}

export async function getJob(jobId: string): Promise<BulkJob | null> {
  if (!jobId) return null;
  const cleanId = jobId.trim();

  try {
    if (db) {
      const snap = await getDoc(doc(db, "generationJobs", cleanId));
      if (snap.exists()) {
        const jobData = snap.data() as BulkJob;
        // Sync to local
        const local = readLocalJobs();
        local[cleanId] = jobData;
        writeLocalJobs(local);
        return jobData;
      }
    }
  } catch (err) {
    console.warn("Firestore getJob notice:", err);
  }

  const local = readLocalJobs();
  return local[cleanId] || null;
}

export async function saveJob(job: BulkJob): Promise<BulkJob> {
  const cleanId = job.jobId.trim();
  const fullJob: BulkJob = {
    ...job,
    jobId: cleanId,
    updatedAt: new Date().toISOString()
  };

  // Always save to local JSON file for instant access & fallback
  const local = readLocalJobs();
  local[cleanId] = fullJob;
  writeLocalJobs(local);

  try {
    if (db) {
      await setDoc(doc(db, "generationJobs", cleanId), fullJob, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save job to Firestore:", err);
  }

  return fullJob;
}

export async function getAllJobs(): Promise<BulkJob[]> {
  const jobsMap: Record<string, BulkJob> = readLocalJobs();

  try {
    if (db) {
      const snap = await getDocs(collection(db, "generationJobs"));
      snap.docs.forEach((d) => {
        const data = d.data() as BulkJob;
        if (data && data.jobId) {
          jobsMap[data.jobId] = data;
        }
      });
      writeLocalJobs(jobsMap);
    }
  } catch (err) {
    console.warn("Firestore getAllJobs notice:", err);
  }

  const list = Object.values(jobsMap);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}
