/**
 * A cell that starts with = + - @ (or a tab / carriage return) is read as a
 * formula by Excel and Sheets, so a student who set their name to
 * "=HYPERLINK(...)" could run something on a teacher's machine when they open
 * an export. Prefixing an apostrophe makes it plain text. Real numbers
 * (including negative ones) are left alone.
 */
function guardFormula(value: string): string {
  if (/^-?\d+(\.\d+)?$/.test(value)) return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvEscape(value: string): string {
  const safe = guardFormula(value);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/** The CSV text for some rows. Pure, so it can be tested. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

/** Builds a CSV string from rows and triggers a browser download - no server round-trip, no dependency. */
export function downloadCsv(filename: string, rows: string[][]) {
  // The leading BOM makes Excel read the file as UTF-8, so a £ or an accented
  // name doesn't turn into garbage.
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
