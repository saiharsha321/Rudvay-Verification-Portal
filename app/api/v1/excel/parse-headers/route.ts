import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!rows || rows.length === 0) {
      return NextResponse.json({ detail: "Uploaded spreadsheet contains no data" }, { status: 400 });
    }

    const headers = Object.keys(rows[0]);
    const suggestedMapping: Record<string, string> = {};

    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes("name") || lower.includes("student") || lower.includes("recipient") || lower.includes("participant")) {
        if (!suggestedMapping.name) suggestedMapping.name = h;
      } else if (lower.includes("mail")) {
        if (!suggestedMapping.email) suggestedMapping.email = h;
      } else if (lower.includes("course") || lower.includes("program") || lower.includes("topic")) {
        if (!suggestedMapping.course) suggestedMapping.course = h;
      } else if (lower.includes("date") || lower.includes("completion")) {
        if (!suggestedMapping.date) suggestedMapping.date = h;
      } else if (lower.includes("duration") || lower.includes("hour")) {
        if (!suggestedMapping.duration) suggestedMapping.duration = h;
      }
    });

    return NextResponse.json({
      headers,
      sampleRows: rows.slice(0, 5),
      totalRowCount: rows.length,
      suggestedMapping
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to parse spreadsheet headers" }, { status: 500 });
  }
}
