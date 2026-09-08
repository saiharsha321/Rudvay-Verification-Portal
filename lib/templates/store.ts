import { INITIAL_TEMPLATES, TemplateRecord } from "./default-templates";

// In-memory server-side storage
let memoryTemplates: TemplateRecord[] = [...INITIAL_TEMPLATES];

export function getTemplatesStore(): TemplateRecord[] {
  return memoryTemplates;
}

export function getTemplateByIdStore(id: string): TemplateRecord | undefined {
  return memoryTemplates.find(t => t.templateId === id);
}

export function saveTemplateStore(tpl: {
  templateId?: string;
  name: string;
  pageSize?: "A4" | "LETTER";
  orientation?: "LANDSCAPE" | "PORTRAIT";
  designJson: any;
  ownerId?: string;
}): TemplateRecord {
  const existingIdx = tpl.templateId ? memoryTemplates.findIndex(t => t.templateId === tpl.templateId) : -1;

  if (existingIdx >= 0) {
    const existing = memoryTemplates[existingIdx];
    const updated: TemplateRecord = {
      ...existing,
      name: tpl.name || existing.name,
      pageSize: tpl.pageSize || existing.pageSize,
      orientation: tpl.orientation || existing.orientation,
      currentVersion: (existing.currentVersion || 1) + 1,
      designJson: tpl.designJson || existing.designJson,
      updatedAt: new Date().toISOString()
    };
    memoryTemplates[existingIdx] = updated;
    return updated;
  } else {
    const newId = tpl.templateId || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: TemplateRecord = {
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
    memoryTemplates.push(newRecord);
    return newRecord;
  }
}

export function deleteTemplateStore(id: string): boolean {
  const initLength = memoryTemplates.length;
  memoryTemplates = memoryTemplates.filter(t => t.templateId !== id);
  return memoryTemplates.length < initLength;
}
