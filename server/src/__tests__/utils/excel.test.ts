import ExcelJS from "exceljs";
import { buildExcelBuffer, sanitizeSheetName } from "../../utils/excel.js";

describe("sanitizeSheetName", () => {
  it("strips forbidden characters", () => {
    expect(sanitizeSheetName("Sales: Q1/Q2*")).toBe("Sales Q1 Q2");
  });

  it("truncates to 31 characters", () => {
    expect(
      sanitizeSheetName("A very long sheet name that exceeds thirty-one characters"),
    ).toHaveLength(31);
  });

  it("falls back to Sheet1 for empty names", () => {
    expect(sanitizeSheetName("   ")).toBe("Sheet1");
  });
});

describe("buildExcelBuffer", () => {
  const rows = [
    { "Product Name": "Sugar", Qty: 2, Price: 150.5 },
    { "Product Name": "Rice", Qty: 1, Price: 220 },
  ];

  it("round-trips headers and rows through a real xlsx file", async () => {
    const buffer = await buildExcelBuffer(rows, "Inventory");

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    // OOXML files are ZIP archives — they start with the PK signature.
    expect(buffer.subarray(0, 2).toString("ascii")).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    // exceljs's legacy Buffer typings clash with @types/node generics;
    // a Buffer is a Uint8Array at runtime, which load() accepts.
    await (workbook.xlsx.load as unknown as (data: Uint8Array) => Promise<ExcelJS.Workbook>)(
      buffer,
    );
    const sheet = workbook.getWorksheet("Inventory");
    expect(sheet).toBeDefined();
    expect((sheet!.getRow(1).values as unknown[]).slice(1)).toEqual([
      "Product Name",
      "Qty",
      "Price",
    ]);
    expect((sheet!.getRow(2).values as unknown[]).slice(1)).toEqual(["Sugar", 2, 150.5]);
    expect((sheet!.getRow(3).values as unknown[]).slice(1)).toEqual(["Rice", 1, 220]);
    expect(sheet!.rowCount).toBe(3);
  });

  it("produces an empty sheet for empty rows", async () => {
    const buffer = await buildExcelBuffer([], "Empty");

    const workbook = new ExcelJS.Workbook();
    await (workbook.xlsx.load as unknown as (data: Uint8Array) => Promise<ExcelJS.Workbook>)(
      buffer,
    );
    expect(workbook.getWorksheet("Empty")).toBeDefined();
  });
});
