import ExcelJS from "exceljs";

import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";
import { conciliationTypes, ValidationRule } from "./types";

class Model {
  private Dao: Dao;
  constructor(environment: EnvironmentTypes) {
    this.Dao = new Dao(environment);
  }

  async getWorkbookReaderStream(bucket: string, key: string) {
    const s3Stream = await this.Dao.getStream(bucket, key);
    const workbookReader: any = new ExcelJS.stream.xlsx.WorkbookReader(
      s3Stream,
      {
        sharedStrings: "cache",
        worksheets: "emit"
      }
    );
    return workbookReader;
  }

  async processWorksheet(workbookReaderStream: any, conciliationType: string) {
    const errors: string[] = [];

    for await (const worksheet of workbookReaderStream) {
      console.log(`📄 Procesando hoja: ${worksheet.name}`);

      let headers: string[] = [];
      let rowIndex = 1;

      for await (const row of worksheet) {
        const rowValues = row.values;

        if (!Array.isArray(rowValues) || rowValues.length === 0) continue;

        if (rowIndex === 1) {
          headers = rowValues.slice(1);
          rowIndex++;
          continue;
        }

        const schema =
          conciliationType === conciliationTypes.payments ? paymentSchema : []; // luego puedes usar otro esquema

        const rowErrors = validateRow(rowValues, headers, schema, rowIndex);

        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        } else {
          console.log("✅ Insertando a la BDD:", rowValues.slice(1));
        }

        rowIndex++;
      }
    }

    if (errors.length > 0) {
      console.warn("⚠️ Errores encontrados:", errors);
      // Aquí podrías enviar el array `errors` a un endpoint vía fetch o SNS, etc.
    } else {
      console.log("📥 Archivo procesado sin errores");
    }
  }
}

const paymentSchema: ValidationRule[] = [
  {
    header: "Id transportadora*",
    key: "idCarrier",
    type: "number",
    required: true
  },
  {
    header: "Numero de Guia *",
    key: "carrierTrackingCode",
    type: "string",
    required: true,
    pattern: /^\d+$/
  },
  {
    header: "Fecha de recaudo *",
    key: "collectionDate",
    type: "date",
    required: true
  },
  {
    header: "Observaciones",
    key: "notes",
    type: "string",
    required: false
  },
  {
    header: "Medio de pago *",
    key: "paymentMethod",
    type: "enum",
    required: true,
    enumValues: ["Efectivo", "Tarjeta"]
  },
  { header: "Valor *", key: "amount", type: "decimal", required: true },
  {
    header: "Fecha de pago *",
    key: "paymentDate",
    type: "date",
    required: true
  }
];

function validateRow(
  row: any[],
  headers: string[],
  schema: ValidationRule[],
  rowIndex: number
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < schema.length; i++) {
    const rule = schema[i];
    const cellValue = row[i + 1]; // porque row[0] es null en ExcelJS
    const header = headers[i];

    if (
      rule.required &&
      (cellValue === undefined || cellValue === null || cellValue === "")
    ) {
      errors.push(`Fila ${rowIndex}: El campo "${header}" es obligatorio`);
      continue;
    }

    if (cellValue === undefined || cellValue === null || cellValue === "") {
      continue;
    }

    switch (rule.type) {
      case "number":
        if (isNaN(Number(cellValue)) || !Number.isInteger(Number(cellValue))) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser un número entero`
          );
        }
        break;
      case "decimal":
        if (isNaN(Number(cellValue))) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser un número decimal`
          );
        }
        break;
      case "date":
        if (isNaN(Date.parse(cellValue))) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser una fecha válida`
          );
        }
        break;
      case "enum":
        if (!rule.enumValues?.includes(cellValue)) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser uno de: ${rule.enumValues?.join(", ")}`
          );
        }
        break;
      case "string":
        if (rule.pattern && !rule.pattern.test(cellValue)) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" tiene un formato inválido`
          );
        }
        break;
    }
  }

  return errors;
}

export default Model;
