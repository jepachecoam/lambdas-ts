import httpResponse from "../../../shared/responses/http";
import { xlsxResponse } from "../../../shared/responses/xlsx";
import { generateExcelFromData } from "../../../shared/services/generateExcel";
import Dao from "./dao";

export const handler = async (event: any): Promise<any> => {
  try {
    console.log("event =>>>", JSON.stringify(event, null, 2));
    const value = event.value;

    const dao = new Dao();

    const data = await dao.otherData(value);

    if (data.length === 0) {
      return httpResponse({
        statusCode: 404,
        body: {
          message: "No se encontraron datos"
        }
      });
    }
    if (data.length > 3) {
      console.log("Sending Event to Event Bridge...");
      return httpResponse({
        statusCode: 202,
        body: {
          message: "Report is being generated"
        }
      });
    }

    const buffer = await generateExcelFromData(data);

    return xlsxResponse({ buffer, filename: "example-report" });
  } catch (error) {
    console.error("Error generando Excel:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error interno al generar el Excel" })
    };
  }
};
