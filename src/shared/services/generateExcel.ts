import ExcelJS from "exceljs";

export async function generateExcelFromData(
  data: Record<string, any>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Reporte");

  if (data.length === 0) {
    worksheet.getCell("A1").value = "No hay datos disponibles";
  } else {
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    data.forEach((item) => {
      const row = headers.map((key) => (item as Record<string, any>)[key]);
      worksheet.addRow(row);
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
