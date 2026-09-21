import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mappingJson = formData.get("mappingJson") as string;

    if (!file || !mappingJson) {
      return NextResponse.json({ detail: "Missing file or column mapping" }, { status: 400 });
    }

    const mapping = JSON.parse(mappingJson);
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const validRows: any[] = [];
    const errors: { rowNumber: number; field: string; message: string; value: any }[] = [];
    const seenEmails = new Set<string>();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // spreadsheet 1-based line including header
      const name = String(row[mapping.name] || "").trim();
      const email = String(row[mapping.email] || "").trim();
      const course = String(row[mapping.course] || "").trim();
      const date = String(row[mapping.date] || "").trim() || new Date().toISOString().split("T")[0];
      const duration = String(row[mapping.duration] || "").trim() || "20 Hours";

      if (!name) {
        errors.push({ rowNumber: rowNum, field: "name", message: "Missing recipient name", value: name });
        return;
      }

      if (!email || !email.includes("@") || !email.includes(".")) {
        errors.push({ rowNumber: rowNum, field: "email", message: "Invalid email syntax", value: email });
        return;
      }

      if (seenEmails.has(email.toLowerCase())) {
        errors.push({ rowNumber: rowNum, field: "email", message: "Duplicate email in dataset", value: email });
        return;
      }

      if (!course) {
        errors.push({ rowNumber: rowNum, field: "course", message: "Missing course or program name", value: course });
        return;
      }

      seenEmails.add(email.toLowerCase());

      const mappedRow: Record<string, any> = {
        ...row,
        name,
        email,
        course,
        date,
        duration
      };

      Object.entries(mapping).forEach(([placeholderKey, headerName]) => {
        if (headerName && row[headerName as string] !== undefined) {
          mappedRow[placeholderKey] = String(row[headerName as string]).trim();
        }
      });

      validRows.push(mappedRow);
    });

    return NextResponse.json({
      totalRows: rows.length,
      validRowsCount: validRows.length,
      invalidRowsCount: errors.length,
      headers: Object.keys(rows[0] || {}),
      validRows,
      errors
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to validate spreadsheet data" }, { status: 500 });
  }
}
