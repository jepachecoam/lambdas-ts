import axios from "axios";
import ExcelJS from "exceljs";

import { EnvironmentTypes } from "../../shared/types/database";
import Dao from "./dao";
import Dto from "./dto";
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
    await this.handleProcessingResult({
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
    const validRows: any[] = [];
    const batchSize = parseInt(`${process.env[Envs.BATCH_SIZE]}`);
    let headers: string[] = [];
    let rowIndex = 1;
    let validRowsCounter = 0;

    for await (const row of worksheet) {
      const rowValues = row.values;

      if (!Array.isArray(rowValues) || rowValues.length === 0) {
        // se deja de leer registros cuando se encuentra una fila vacia.
        console.log(`📥La fila ${rowIndex} esta vacia.`);
        console.log(`Finalizando el proceso de la hoja ${worksheet.name}.`);
        console.log(
          `Total de filas leidas ${rowIndex - 1}, exitosas ${validRows.length} fallidas ${errors.length}.`
        );
        break;
      }

      if (rowIndex === 1) {
        headers = this.extractHeaders(rowValues);
        rowIndex++;
        continue;
      }

      const schema = this.getSchema(conciliationType);
      const { rowErrors, validValues } = validators.validateRow(
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
        validRows.push(validValues);

        if (validRows.length >= batchSize) {
          validRowsCounter += validRows.length;
          const records = validRows.splice(0, batchSize);
          await this.saveRows(records, conciliationType);
          console.log(
            `📥 Guardando ${records.length} registros en la base de datos.`
          );
        }
      }

      rowIndex++;
    }

    if (validRows.length > 0) {
      validRowsCounter += validRows.length;
      await this.saveRows(validRows, conciliationType);
      console.log(
        `📥 Guardando ${validRows.length} registros en la base de datos.`
      );
    }

    await Model.sendSlackNotification({
      conciliationType,
      step: "Procesamiento de registros completado",
      data: `Total de filas leidas ${rowIndex - 1}, exitosas ${validRowsCounter} fallidas ${errors.length}.`,
      environment: this.environment
    });

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

  private async saveRows(rowValues: any[][], conciliationType: string) {
    switch (conciliationType) {
      case ConciliationTypes.payments: {
        const rowValuesParsed = Dto.rowValuesToCarrierPayment(rowValues);
        return await this.Dao.bulkInsertCarrierPayment(rowValuesParsed);
      }
      case ConciliationTypes.charges: {
        const rowValuesParsed = Dto.rowValuesToCarrierCharge(rowValues);
        return await this.Dao.bulkInsertCarrierCharge(rowValuesParsed);
      }
      default:
        throw new Error(
          `❌ Tipo de conciliación no soportado: ${conciliationType}`
        );
    }
  }

  private async handleProcessingResult({
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
      await Model.sendSlackNotification({
        conciliationType,
        step: "Validacion de tipos de los registros en el archivo",
        data: errors,
        environment
      });
    } else {
      console.log("📥 Archivo procesado sin errores");
      await Model.sendSlackNotification({
        conciliationType,
        step: "Validacion de tipos de los registros en el archivo",
        data: "Completado sin errores",
        environment
      });
    }
  }

  static async sendSlackNotification({
    conciliationType,
    step,
    data,
    environment
  }: {
    conciliationType: string;
    step: string;
    data: any;
    environment: string;
  }) {
    try {
      const urlToSend = `${process.env[Envs.SLACK_WEBHOOK_URL]}`;

      const formattedJson =
        "```json\n" + JSON.stringify(data, null, 2) + "\n```";

      const response = await axios.post(urlToSend, {
        environment,
        conciliationType,
        step,
        data: formattedJson
      });
      console.log("response =>>>", response.data);
    } catch (error) {
      console.error("Error in sendSlackNotification =>>>", error);
    }
  }
}

export default Model;
