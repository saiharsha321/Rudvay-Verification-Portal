import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

export interface CoordinatorRecord {
  coordinatorId: string;
  name: string;
  email: string;
  active: boolean;
  role: "COORDINATOR" | "ADMIN";
  createdAt: string;
  updatedAt?: string;
}

const LOCAL_COORDINATORS_FILE = path.join(process.cwd(), "coordinators_data.json");

const DEFAULT_COORDINATORS: Record<string, CoordinatorRecord> = {
  "coord_default_01": {
    coordinatorId: "coord_default_01",
    name: "Lead Technical Coordinator",
    email: "info.rudvay@gmail.com",
    active: true,
    role: "COORDINATOR",
    createdAt: "2026-09-01T10:00:00.000Z"
  },
  "coord_default_02": {
    coordinatorId: "coord_default_02",
    name: "System Administrator",
    email: "admin@rudvaytech.com",
    active: true,
    role: "ADMIN",
    createdAt: "2026-09-01T09:00:00.000Z"
  }
};

function readLocalCoordinators(): Record<string, CoordinatorRecord> {
  try {
    if (fs.existsSync(LOCAL_COORDINATORS_FILE)) {
      const raw = fs.readFileSync(LOCAL_COORDINATORS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Notice: Failed to read local coordinators_data.json", e);
  }
  return { ...DEFAULT_COORDINATORS };
}

function writeLocalCoordinators(data: Record<string, CoordinatorRecord>) {
  try {
    fs.writeFileSync(LOCAL_COORDINATORS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.warn("Notice: Failed to write local coordinators_data.json", e);
  }
}

export async function getAllCoordinators(): Promise<CoordinatorRecord[]> {
  const map: Record<string, CoordinatorRecord> = readLocalCoordinators();

  try {
    if (db) {
      const snap = await getDocs(collection(db, "coordinators"));
      snap.docs.forEach((d) => {
        const item = d.data() as CoordinatorRecord;
        if (item && item.coordinatorId) {
          map[item.coordinatorId] = item;
        }
      });
      writeLocalCoordinators(map);
    }
  } catch (err) {
    console.warn("Firestore getAllCoordinators notice:", err);
  }

  const list = Object.values(map);
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function getCoordinator(id: string): Promise<CoordinatorRecord | null> {
  if (!id) return null;
  const cleanId = id.trim();

  try {
    if (db) {
      const snap = await getDoc(doc(db, "coordinators", cleanId));
      if (snap.exists()) {
        const item = snap.data() as CoordinatorRecord;
        const local = readLocalCoordinators();
        local[cleanId] = item;
        writeLocalCoordinators(local);
        return item;
      }
    }
  } catch (err) {
    console.warn("Firestore getCoordinator notice:", err);
  }

  const local = readLocalCoordinators();
  return local[cleanId] || null;
}

export async function saveCoordinator(record: Partial<CoordinatorRecord> & { email: string; name: string }): Promise<CoordinatorRecord> {
  const cleanId = record.coordinatorId || `coord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullRecord: CoordinatorRecord = {
    coordinatorId: cleanId,
    name: record.name.trim(),
    email: record.email.trim().toLowerCase(),
    active: record.active !== undefined ? record.active : true,
    role: record.role || "COORDINATOR",
    createdAt: record.createdAt || now,
    updatedAt: now
  };

  const local = readLocalCoordinators();
  local[cleanId] = fullRecord;
  writeLocalCoordinators(local);

  try {
    if (db) {
      await setDoc(doc(db, "coordinators", cleanId), fullRecord, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save coordinator to Firestore:", err);
  }

  return fullRecord;
}

export async function toggleCoordinatorActive(id: string, active: boolean): Promise<CoordinatorRecord | null> {
  const existing = await getCoordinator(id);
  if (!existing) return null;

  return await saveCoordinator({
    ...existing,
    active,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteCoordinator(id: string): Promise<boolean> {
  const cleanId = id.trim();
  const local = readLocalCoordinators();
  delete local[cleanId];
  writeLocalCoordinators(local);

  try {
    if (db) {
      await deleteDoc(doc(db, "coordinators", cleanId));
    }
  } catch (err) {
    console.error("Failed to delete coordinator from Firestore:", err);
  }

  return true;
}
