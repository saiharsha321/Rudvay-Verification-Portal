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

      const getRowValue = (targetHeader?: string): any => {
        if (!targetHeader) return undefined;
        if (row[targetHeader] !== undefined && row[targetHeader] !== null && String(row[targetHeader]).trim() !== "") {
          return row[targetHeader];
        }
        const normTarget = targetHeader.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const [k, v] of Object.entries(row)) {
          if (v !== undefined && v !== null && String(v).trim() !== "") {
            const normK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
            if (normK === normTarget) {
              return v;
            }
          }
        }
        return undefined;
      };

      // Find standard field headers from mapping or fuzzy match
      const nameHeader = mapping.name || Object.keys(mapping).find(k => k.toLowerCase() === "name");
      const emailHeader = mapping.email || Object.keys(mapping).find(k => k.toLowerCase() === "email");
      const courseHeader = mapping.course || Object.keys(mapping).find(k => k.toLowerCase() === "course");
      const dateHeader = mapping.date || Object.keys(mapping).find(k => k.toLowerCase() === "date");
      const durationHeader = mapping.duration || Object.keys(mapping).find(k => k.toLowerCase() === "duration");

      const nameVal = getRowValue(nameHeader) || getRowValue("name") || getRowValue("Name");
      const emailVal = getRowValue(emailHeader) || getRowValue("email") || getRowValue("Email");
      const courseVal = getRowValue(courseHeader) || getRowValue("course") || getRowValue("Course");
      const rawDateVal = getRowValue(dateHeader) || getRowValue("date") || getRowValue("Date");
      const durationVal = getRowValue(durationHeader) || getRowValue("duration") || getRowValue("Duration");

      const name = String(nameVal || "").trim();
      const email = String(emailVal || "").trim();
      const course = String(courseVal || "").trim();
      const dateStr = formatExcelDate(rawDateVal);
      const date = dateStr || new Date().toISOString().split("T")[0];
      const duration = String(durationVal || "20 Hours").trim();

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

      // Pre-format raw row items and store normalized keys
      const mappedRow: Record<string, any> = {
        name,
        email,
        course,
        date,
        duration
      };

      Object.entries(row).forEach(([k, v]) => {
        let val = v;
        if (k.toLowerCase().includes("date") || (typeof v === "number" && v > 1000 && v < 100000) || v instanceof Date) {
          val = formatExcelDate(v);
        } else if (v !== undefined && v !== null) {
          val = String(v).trim();
        }
        mappedRow[k] = val;
        mappedRow[k.trim().toLowerCase()] = val;
        mappedRow[k.trim().toLowerCase().replace(/[^a-z0-9]/g, "")] = val;
        mappedRow[k.trim().replace(/\s+/g, "_").toLowerCase()] = val;
      });

      // Map explicit user choices from step 2
      Object.entries(mapping).forEach(([placeholderKey, headerName]) => {
        if (headerName) {
          let val = getRowValue(headerName as string);
          if (val !== undefined && val !== null) {
            if (placeholderKey.toLowerCase().includes("date") || (typeof val === "number" && val > 1000 && val < 100000) || val instanceof Date) {
              val = formatExcelDate(val);
            } else {
              val = String(val).trim();
            }
            mappedRow[placeholderKey] = val;
            mappedRow[placeholderKey.trim().toLowerCase()] = val;
            mappedRow[placeholderKey.trim().toLowerCase().replace(/[^a-z0-9]/g, "")] = val;
            mappedRow[placeholderKey.trim().replace(/\s+/g, "_").toLowerCase()] = val;
          }
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
