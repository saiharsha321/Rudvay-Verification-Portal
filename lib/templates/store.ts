import fs from "fs";
import path from "path";
import { INITIAL_TEMPLATES, TemplateRecord } from "./default-templates";

const DATA_FILE = path.join(process.cwd(), "templates_data.json");

function loadTemplatesFromDisk(): TemplateRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to load templates from disk:", err);
  }
  return [...INITIAL_TEMPLATES];
}

function saveTemplatesToDisk(templates: TemplateRecord[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(templates, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save templates to disk:", err);
  }
}

let memoryTemplates: TemplateRecord[] = loadTemplatesFromDisk();

export function getTemplatesStore(): TemplateRecord[] {
  memoryTemplates = loadTemplatesFromDisk();
  return memoryTemplates;
}

export function getTemplateByIdStore(id: string): TemplateRecord | undefined {
  const all = getTemplatesStore();
  return all.find(t => t.templateId === id);
}

export function saveTemplateStore(tpl: {
  templateId?: string;
  name: string;
  pageSize?: "A4" | "LETTER";
  orientation?: "LANDSCAPE" | "PORTRAIT";
  designJson: any;
  ownerId?: string;
}): TemplateRecord {
  const currentTemplates = getTemplatesStore();
  const existingIdx = tpl.templateId ? currentTemplates.findIndex(t => t.templateId === tpl.templateId) : -1;

  let updatedRecord: TemplateRecord;

  if (existingIdx >= 0) {
    const existing = currentTemplates[existingIdx];
    updatedRecord = {
      ...existing,
      name: tpl.name || existing.name,
      pageSize: tpl.pageSize || existing.pageSize,
      orientation: tpl.orientation || existing.orientation,
      currentVersion: (existing.currentVersion || 1) + 1,
      designJson: tpl.designJson || existing.designJson,
      updatedAt: new Date().toISOString()
    };
    currentTemplates[existingIdx] = updatedRecord;
  } else {
    const newId = tpl.templateId || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
    currentTemplates.push(updatedRecord);
  }

  saveTemplatesToDisk(currentTemplates);
  memoryTemplates = currentTemplates;
  return updatedRecord;
}

export function deleteTemplateStore(id: string): boolean {
  const currentTemplates = getTemplatesStore();
  const initLength = currentTemplates.length;
  const filtered = currentTemplates.filter(t => t.templateId !== id);
  if (filtered.length < initLength) {
    saveTemplatesToDisk(filtered);
    memoryTemplates = filtered;
    return true;
  }
  return false;
}
