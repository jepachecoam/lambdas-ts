import axios from "axios";
import ExcelJS from "exceljs";

import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";
import schemas from "./schemas";
import { ConciliationTypes, Envs } from "./types";
import validators from "./validators";

class Model {
  private Dao: Dao;
  private environment: EnvironmentTypes;
  constructor(environment: EnvironmentTypes) {
    this.Dao = new Dao(environment);
    this.environment = environment;
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
    this.handleProcessingResult({
      conciliationType,
      errors,
      environment: this.environment
    });
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
    const errors: any[] = [];
    let headers: string[] = [];
    let rowIndex = 1;

    for await (const row of worksheet) {
      const rowValues = row.values;

      if (!Array.isArray(rowValues) || rowValues.length === 0) {
        console.log("Empty row");
        rowIndex++;
        continue;
      }

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
        errors.push({
          row: rowIndex,
          errors: rowErrors
        });
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
      case ConciliationTypes.payments:
        return schemas.paymentSchema;
      case ConciliationTypes.charges:
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

  private handleProcessingResult({
    conciliationType,
    errors,
    environment
  }: {
    conciliationType: string;
    errors: any;
    environment: EnvironmentTypes;
  }) {
    if (errors.length > 0) {
      console.warn("⚠️ Errores encontrados:", errors);
      this.sendSlackNotification({
        conciliationType,
        step: "Validacion de tipos de los registros en el archivo",
        data: errors,
        environment
      });
    } else {
      console.log("📥 Archivo procesado sin errores");
      this.sendSlackNotification({
        conciliationType,
        step: "Validacion de tipos de los registros en el archivo",
        data: "Completado sin errores",
        environment
      });
    }
  }

  private async sendSlackNotification({
    conciliationType,
    step,
    data,
    environment
  }: {
    conciliationType: string;
    step: string;
    data: any;
    environment: EnvironmentTypes;
  }) {
    const payload = {
      environment,
      conciliationType,
      step,
      data: JSON.stringify(data)
    };
    const urlToSend = `${process.env[Envs.SLACK_WEBHOOK_URL]}`;

    const response = await axios.post(urlToSend, payload);
    console.log("response =>>>", response.data);
  }
}

export default Model;
