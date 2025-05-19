import ExcelJS from "exceljs";

import { checkEnv } from "../../shared/envChecker";
import { contextEnv, dbEnv } from "../../shared/types";
import Dao from "./dao";
import Dto from "./dto";

export const handler = async (event: any) => {
  try {
    checkEnv({ ...contextEnv, ...dbEnv });

    const environment = "dev";

    const dao = new Dao(environment);

    const { bucket, key } = Dto.getParams(event);

    const s3Stream = await dao.getStream(bucket, key);

    const workbookReader: any = new ExcelJS.stream.xlsx.WorkbookReader(
      s3Stream,
      {
        sharedStrings: "cache",
        worksheets: "emit"
      }
    );

    for await (const worksheet of workbookReader) {
      console.log(`📄 Procesando hoja: ${worksheet.name}`);
      for await (const row of worksheet) {
        const rowValues = row.values;
        if (!Array.isArray(rowValues) || rowValues.length === 0) continue;

        const isValid = rowValues.every(
          (cell) => cell !== null && cell !== undefined && cell !== ""
        );

        if (isValid) {
          console.log(`✅ Insertando fila ${row.number}:`, rowValues.slice(1));
        } else {
          console.warn(`⚠️ Fila inválida ${row.number}:`, rowValues.slice(1));
        }
      }
    }

    console.log("📥 Archivo recibido y procesado exitosamente");
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};
