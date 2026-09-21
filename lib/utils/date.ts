/**
 * Safely converts Excel serial numbers, Date objects, or string representations into
 * a formatted date string (YYYY-MM-DD).
 */
export function formatExcelDate(val: any): string {
  if (val === undefined || val === null || val === "") return "";

  // 1. If val is a Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const yyyy = val.getUTCFullYear();
      const mm = String(val.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(val.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // 2. If val is a number or numeric string (e.g. 46286 or "46286")
  const num = typeof val === "number" ? val : (typeof val === "string" && /^\d+(\.\d+)?$/.test(val.trim()) ? Number(val.trim()) : NaN);
  
  if (!isNaN(num) && num > 1000 && num < 100000) {
    // Excel date epoch: 1900-01-01. Offset to Unix epoch (1970-01-01) is 25569 days.
    const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getUTCFullYear();
      const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  const str = String(val).trim();

  // 3. If str is already formatted as YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str) || /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
    return str;
  }

  // 4. Try parsing standard date strings
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && str.length >= 8 && !/^\d+$/.test(str)) {
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return str;
}
