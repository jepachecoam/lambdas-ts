import ExcelJS from "exceljs";

import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";
import schemas from "./schemas";
import { conciliationTypes } from "./types";
import validators from "./validators";

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
    const worksheet = await this.getFirstWorksheet(workbookReaderStream);
    if (!worksheet) {
      console.warn("❌ No se encontró ninguna hoja en el archivo.");
      return;
    }

    console.log(`📄 Procesando hoja: ${worksheet.name}`);

    const { errors } = await this.processRowsFromWorksheet(
      worksheet,
      conciliationType
    );
    this.handleProcessingResult(errors);
  }

  private async getFirstWorksheet(
    workbookReaderStream: any
  ): Promise<any | null> {
    for await (const worksheet of workbookReaderStream) {
      return worksheet; // Solo se procesa la primera hoja
    }
    return null;
  }

  private async processRowsFromWorksheet(
    worksheet: any,
    conciliationType: string
  ) {
    const errors: string[] = [];
    let headers: string[] = [];
    let rowIndex = 1;

    for await (const row of worksheet) {
      const rowValues = row.values;

      if (!Array.isArray(rowValues) || rowValues.length === 0) continue;

      if (rowIndex === 1) {
        headers = this.extractHeaders(rowValues);
        rowIndex++;
        continue;
      }

      const schema = this.getSchema(conciliationType);
      const rowErrors = validators.validateRow(
        rowValues,
        headers,
        schema,
        rowIndex
      );

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        this.saveRow(rowValues);
      }

      rowIndex++;
    }

    return { errors };
  }

  private extractHeaders(rowValues: any[]): string[] {
    return rowValues.slice(1); // Omite la celda vacía en [0]
  }

  private getSchema(conciliationType: string): any[] {
    switch (conciliationType) {
      case conciliationTypes.payments:
        return schemas.paymentSchema;
      case conciliationTypes.charges:
        return schemas.chargeSchema;
      default:
        throw new Error(
          `❌ Tipo de conciliación no soportado: ${conciliationType}`
        );
    }
  }

  private saveRow(rowValues: any[]) {
    console.log("✅ Insertando a la BDD:", rowValues.slice(1));
    console.log("Falta implementar");
  }

  private handleProcessingResult(errors: string[]) {
    if (errors.length > 0) {
      console.warn("⚠️ Errores encontrados:", errors);
      console.log("Enviando a Slack...");
    } else {
      console.log("📥 Archivo procesado sin errores");
    }
  }
}

export default Model;
