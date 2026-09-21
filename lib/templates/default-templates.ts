import { TemplateDesignData } from "@/components/certificate-editor/canvas-editor";

export interface TemplateRecord {
  templateId: string;
  name: string;
  pageSize: "A4" | "LETTER";
  orientation: "LANDSCAPE" | "PORTRAIT";
  currentVersion: number;
  status: "PUBLISHED" | "DRAFT";
  ownerId?: string;
  designJson: TemplateDesignData;
  createdAt?: string;
  updatedAt?: string;
}

export const SAMPLE_TEMPLATE_CLASSIC_GOLD: TemplateRecord = {
  templateId: "tpl_classic_gold",
  name: "Certificate of Excellence (Classic Gold)",
  pageSize: "A4",
  orientation: "LANDSCAPE",
  currentVersion: 1,
  status: "PUBLISHED",
  designJson: {
    width: 842,
    height: 595,
    backgroundColor: "#FFFFFF",
    accentColor: "#D4AF37",
    border: {
      style: "double",
      color: "#0B192C",
      width: 3,
      inset: 20
    },
    elements: [
      {
        id: "elem_gold_title",
        type: "TEXT",
        x: 50,
        y: 55,
        width: 742,
        height: 40,
        content: "RUDVAY TECH",
        fontFamily: "Helvetica",
        fontSize: 28,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#0B192C",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_subtitle",
        type: "TEXT",
        x: 50,
        y: 100,
        width: 742,
        height: 30,
        content: "CERTIFICATE OF COMPLETION",
        fontFamily: "Helvetica",
        fontSize: 18,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#D4AF37",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_line",
        type: "LINE",
        x: 271,
        y: 140,
        width: 300,
        height: 4,
        content: "",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#D4AF37",
        strokeWidth: 2,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_present",
        type: "TEXT",
        x: 50,
        y: 165,
        width: 742,
        height: 25,
        content: "This is proudly presented to",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "italic",
        alignment: "center",
        textColor: "#64748B",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_name",
        type: "TEXT",
        x: 50,
        y: 200,
        width: 742,
        height: 45,
        content: "{{name}}",
        fontFamily: "Helvetica",
        fontSize: 28,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#0259A1",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_body",
        type: "TEXT",
        x: 70,
        y: 260,
        width: 702,
        height: 35,
        content: "for successfully mastering and completing the curriculum for {{course}}",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#334155",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_event",
        type: "TEXT",
        x: 70,
        y: 300,
        width: 702,
        height: 25,
        content: "Event: {{event}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "italic",
        alignment: "center",
        textColor: "#64748B",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_date",
        type: "TEXT",
        x: 70,
        y: 440,
        width: 260,
        height: 25,
        content: "Issue Date: {{date}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "normal",
        alignment: "left",
        textColor: "#475569",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_id",
        type: "TEXT",
        x: 70,
        y: 470,
        width: 320,
        height: 25,
        content: "Certificate ID: {{certificate_id}}",
        fontFamily: "Helvetica",
        fontSize: 11,
        fontWeight: "bold",
        alignment: "left",
        textColor: "#0B192C",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_gold_qr",
        type: "QR",
        x: 670,
        y: 410,
        width: 95,
        height: 95,
        content: "{{verification_url}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#0B192C",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      }
    ]
  }
};

export const SAMPLE_TEMPLATE_MODERN_CYBER: TemplateRecord = {
  templateId: "tpl_modern_cyber",
  name: "Modern Tech & Cyber Workshop",
  pageSize: "A4",
  orientation: "LANDSCAPE",
  currentVersion: 1,
  status: "PUBLISHED",
  designJson: {
    width: 842,
    height: 595,
    backgroundColor: "#0A1128",
    accentColor: "#00E5FF",
    border: {
      style: "single",
      color: "#00E5FF",
      width: 2,
      inset: 18
    },
    elements: [
      {
        id: "elem_cyber_title",
        type: "TEXT",
        x: 50,
        y: 55,
        width: 742,
        height: 40,
        content: "RUDVAY TECH CYBER PLATFORM",
        fontFamily: "Helvetica",
        fontSize: 24,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#00E5FF",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_subtitle",
        type: "TEXT",
        x: 50,
        y: 100,
        width: 742,
        height: 30,
        content: "CERTIFICATE OF ACHIEVEMENT",
        fontFamily: "Helvetica",
        fontSize: 16,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#94A3B8",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_line",
        type: "LINE",
        x: 221,
        y: 135,
        width: 400,
        height: 4,
        content: "",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#00E5FF",
        strokeWidth: 2,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_certifies",
        type: "TEXT",
        x: 50,
        y: 165,
        width: 742,
        height: 25,
        content: "This certifies that",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "italic",
        alignment: "center",
        textColor: "#94A3B8",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_name",
        type: "TEXT",
        x: 50,
        y: 200,
        width: 742,
        height: 45,
        content: "{{name}}",
        fontFamily: "Helvetica",
        fontSize: 30,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#FFFFFF",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_body",
        type: "TEXT",
        x: 60,
        y: 260,
        width: 722,
        height: 35,
        content: "has demonstrated exemplary proficiency in {{course}}",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#CBD5E1",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_dur",
        type: "TEXT",
        x: 60,
        y: 295,
        width: 722,
        height: 25,
        content: "Duration: {{duration}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#00E5FF",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_date",
        type: "TEXT",
        x: 60,
        y: 440,
        width: 250,
        height: 25,
        content: "Issued: {{date}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "normal",
        alignment: "left",
        textColor: "#94A3B8",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_id",
        type: "TEXT",
        x: 60,
        y: 470,
        width: 320,
        height: 25,
        content: "VERIFIED ID: {{certificate_id}}",
        fontFamily: "Helvetica",
        fontSize: 11,
        fontWeight: "bold",
        alignment: "left",
        textColor: "#00E5FF",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_cyber_qr",
        type: "QR",
        x: 670,
        y: 410,
        width: 95,
        height: 95,
        content: "{{verification_url}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#00E5FF",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      }
    ]
  }
};

export const SAMPLE_TEMPLATE_TESTING1: TemplateRecord = {
  templateId: "tpl_testing1",
  name: "testing1",
  pageSize: "A4",
  orientation: "LANDSCAPE",
  currentVersion: 1,
  status: "PUBLISHED",
  designJson: {
    width: 842,
    height: 595,
    backgroundColor: "#F8FAFC",
    accentColor: "#2563EB",
    border: {
      style: "single",
      color: "#2563EB",
      width: 3,
      inset: 22
    },
    elements: [
      {
        id: "elem_test1_title",
        type: "TEXT",
        x: 50,
        y: 55,
        width: 742,
        height: 40,
        content: "RUDVAY TECH - SAMPLE TEST TEMPLATE",
        fontFamily: "Helvetica",
        fontSize: 22,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#1E293B",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_subtitle",
        type: "TEXT",
        x: 50,
        y: 100,
        width: 742,
        height: 30,
        content: "TESTING 1 - VERIFIED CERTIFICATE",
        fontFamily: "Helvetica",
        fontSize: 16,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#2563EB",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_line",
        type: "LINE",
        x: 271,
        y: 140,
        width: 300,
        height: 4,
        content: "",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#2563EB",
        strokeWidth: 2,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_subtext",
        type: "TEXT",
        x: 50,
        y: 165,
        width: 742,
        height: 25,
        content: "Presented for evaluation & testing to:",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "italic",
        alignment: "center",
        textColor: "#64748B",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_name",
        type: "TEXT",
        x: 50,
        y: 205,
        width: 742,
        height: 45,
        content: "{{name}}",
        fontFamily: "Helvetica",
        fontSize: 28,
        fontWeight: "bold",
        alignment: "center",
        textColor: "#0F172A",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_body",
        type: "TEXT",
        x: 70,
        y: 265,
        width: 702,
        height: 35,
        content: "for completing tests and coursework for {{course}}",
        fontFamily: "Helvetica",
        fontSize: 14,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#334155",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_date",
        type: "TEXT",
        x: 70,
        y: 440,
        width: 250,
        height: 25,
        content: "Date: {{date}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "normal",
        alignment: "left",
        textColor: "#64748B",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_id",
        type: "TEXT",
        x: 70,
        y: 470,
        width: 280,
        height: 25,
        content: "ID: {{certificate_id}}",
        fontFamily: "Helvetica",
        fontSize: 11,
        fontWeight: "bold",
        alignment: "left",
        textColor: "#2563EB",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      },
      {
        id: "elem_test1_qr",
        type: "QR",
        x: 670,
        y: 410,
        width: 90,
        height: 90,
        content: "{{verification_url}}",
        fontFamily: "Helvetica",
        fontSize: 12,
        fontWeight: "normal",
        alignment: "center",
        textColor: "#2563EB",
        strokeWidth: 1,
        opacity: 1,
        visibility: true
      }
    ]
  }
};

export const INITIAL_TEMPLATES: TemplateRecord[] = [
  SAMPLE_TEMPLATE_CLASSIC_GOLD,
  SAMPLE_TEMPLATE_MODERN_CYBER,
  SAMPLE_TEMPLATE_TESTING1
];

import { getTemplateByIdStore } from "./store";

export function getTemplateById(templateId?: string): TemplateRecord {
  if (!templateId) return SAMPLE_TEMPLATE_CLASSIC_GOLD;
  
  // Check store first (persisted saved custom templates)
  const storeFound = getTemplateByIdStore(templateId);
  if (storeFound) return storeFound;

  const found = INITIAL_TEMPLATES.find(t => t.templateId === templateId);
  if (found) return found;

  // Check global or fallback
  if (typeof globalThis !== "undefined" && (globalThis as any).__rudvay_custom_templates) {
    const custom = (globalThis as any).__rudvay_custom_templates[templateId];
    if (custom) return custom;
  }

  return SAMPLE_TEMPLATE_CLASSIC_GOLD;
}

