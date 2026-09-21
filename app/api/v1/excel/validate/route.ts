import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { formatExcelDate } from "@/lib/utils/date";

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
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const validRows: any[] = [];
    const errors: { rowNumber: number; field: string; message: string; value: any }[] = [];
    const seenEmails = new Set<string>();

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // spreadsheet 1-based line including header
      const nameHeader = mapping.name || "name";
      const emailHeader = mapping.email || "email";
      const courseHeader = mapping.course || "course";
      const dateHeader = mapping.date || "date";
      const durationHeader = mapping.duration || "duration";

      const name = String(row[nameHeader] || row.name || "").trim();
      const email = String(row[emailHeader] || row.email || "").trim();
      const course = String(row[courseHeader] || row.course || "").trim();
      
      const rawDateVal = row[dateHeader] !== undefined ? row[dateHeader] : row.date;
      const dateStr = formatExcelDate(rawDateVal);
      const date = dateStr || new Date().toISOString().split("T")[0];
      
      const duration = String(row[durationHeader] || row.duration || "").trim() || "20 Hours";

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

      // Pre-format any dates in raw row
      const formattedRawRow: Record<string, any> = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k.toLowerCase().includes("date") || (typeof v === "number" && v > 1000 && v < 100000) || v instanceof Date) {
          formattedRawRow[k] = formatExcelDate(v);
        } else {
          formattedRawRow[k] = v;
        }
      });

      const mappedRow: Record<string, any> = {
        ...formattedRawRow,
        name,
        email,
        course,
        date,
        duration
      };

      // Map explicit user choices from step 2
      Object.entries(mapping).forEach(([placeholderKey, headerName]) => {
        if (headerName && row[headerName as string] !== undefined) {
          let val = row[headerName as string];
          if (placeholderKey.toLowerCase().includes("date") || (typeof val === "number" && val > 1000 && val < 100000) || val instanceof Date) {
            val = formatExcelDate(val);
          } else {
            val = String(val).trim();
          }
          mappedRow[placeholderKey] = val;
        }
      });

      validRows.push(mappedRow);
    });

    return NextResponse.json({
      totalRows: rawRows.length,
      validRowsCount: validRows.length,
      invalidRowsCount: errors.length,
      headers: Object.keys(rawRows[0] || {}),
      validRows,
      errors
    });
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Failed to validate spreadsheet data" }, { status: 500 });
  }
}
