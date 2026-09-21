import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { INITIAL_TEMPLATES, TemplateRecord } from "./default-templates";

export async function getTemplatesStore(): Promise<TemplateRecord[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, "templates"));
      const docsList = snap.docs.map(d => d.data() as TemplateRecord);
      if (docsList.length > 0) {
        return docsList;
      }
    }
  } catch (err) {
    console.warn("Firestore fetch notice (templates):", err);
  }
  return [...INITIAL_TEMPLATES];
}

export async function getTemplateByIdStore(id: string): Promise<TemplateRecord | undefined> {
  if (!id) return undefined;
  try {
    if (db) {
      const docRef = doc(db, "templates", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as TemplateRecord;
      }
    }
  } catch (err) {
    console.warn("Firestore fetch notice (template by id):", err);
  }
  const defaultList = [...INITIAL_TEMPLATES];
  return defaultList.find(t => t.templateId === id);
}

export async function saveTemplateStore(tpl: {
  templateId?: string;
  name: string;
  pageSize?: "A4" | "LETTER";
  orientation?: "LANDSCAPE" | "PORTRAIT";
  designJson: any;
  ownerId?: string;
}): Promise<TemplateRecord> {
  const newId = tpl.templateId || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const existing = await getTemplateByIdStore(newId);

  let updatedRecord: TemplateRecord;
  if (existing) {
    updatedRecord = {
      ...existing,
      name: tpl.name || existing.name,
      pageSize: tpl.pageSize || existing.pageSize,
      orientation: tpl.orientation || existing.orientation,
      currentVersion: (existing.currentVersion || 1) + 1,
      designJson: tpl.designJson || existing.designJson,
      updatedAt: new Date().toISOString()
    };
  } else {
    updatedRecord = {
      templateId: newId,
      name: tpl.name || "Certificate Template",
      pageSize: tpl.pageSize || "A4",
      orientation: tpl.orientation || "LANDSCAPE",
      currentVersion: 1,
      status: "PUBLISHED",
      ownerId: tpl.ownerId || "coordinator_1",
      designJson: tpl.designJson,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  try {
    if (db) {
      await setDoc(doc(db, "templates", newId), updatedRecord, { merge: true });
    }
  } catch (err) {
    console.error("Failed to save template to Firestore:", err);
  }

  return updatedRecord;
}

export async function deleteTemplateStore(id: string): Promise<boolean> {
  try {
    if (db && id) {
      await deleteDoc(doc(db, "templates", id));
      return true;
    }
  } catch (err) {
    console.error("Failed to delete template from Firestore:", err);
  }
  return false;
}
