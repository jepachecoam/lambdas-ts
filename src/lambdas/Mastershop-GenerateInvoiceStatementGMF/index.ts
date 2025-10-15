import httpResponse from "../../shared/responses/http";
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    const envs = checkEnv({
      ...dbEnv
    });

    const { environment, idInvoice } = dto.getParams(event);

    const model = new Model(environment, envs);

    const pdfBuffer = await model.getGmfStatement({ idInvoice });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="invoice-statement.pdf"'
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true
    };
  } catch (error: any) {
    console.error("ErrorLog :>>>", error);
    return httpResponse({
      statusCode: 500,
      body: {
        message: "Internal server error",
        data: null
      }
    });
  }
};
