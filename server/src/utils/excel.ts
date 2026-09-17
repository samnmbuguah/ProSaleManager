import ExcelJS from "exceljs";

export type ExcelCellValue = string | number | boolean | Date | null | undefined;
export type ExcelRow = Record<string, ExcelCellValue>;

/** Excel sheet names allow at most 31 chars and forbid []:*?/\ characters. */
export function sanitizeSheetName(name: string): string {
  const cleaned = name
    .replace(/[[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);
  return cleaned || "Sheet1";
}

/**
 * Builds an .xlsx file from an array of row objects (keys become headers).
 * Pure helper around exceljs — the maintained replacement for the
 * unmaintained `xlsx` (SheetJS) package previously used for exports.
 */
export async function buildExcelBuffer(rows: ExcelRow[], sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetName));

  if (rows.length > 0) {
    worksheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
    for (const row of rows) {
      worksheet.addRow(row);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}
