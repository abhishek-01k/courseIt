type Cell = string | number | boolean | null | undefined;

// Quotes every field that needs it, and defuses values a spreadsheet would run as a formula (=, +, -, @).
const cell = (v: Cell) => {
  if (v == null) return "";
  let s = String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** A CSV file (with a BOM so Excel reads names in any script correctly). */
export const toCsv = (header: string[], rows: Cell[][]) => `﻿${[header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")}\r\n`;

export const csvResponse = (csv: string, name: string) =>
  new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
