import serverConf from "../../conf/config";
import httpResponse from "../../shared/responses/http";
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    checkEnv({
      ...dbEnv
    });

    const { environment, idInvoice } = dto.getParams(event);

    const model = new Model(environment);

    const pdfGet = await model.getStream(
      String(serverConf.s3.BUCKET_NAME),
      `mastershop/users/gmf/${idInvoice}.pdf`
    );
    if (!pdfGet) {
      const pdfBuffer = await model.getGmfStatement({ idInvoice });
      if (!pdfBuffer) {
        return httpResponse({
          statusCode: 404,
          body: {
            message: "Invoice not found",
            data: null
          }
        });
      }
      await model.putObject(
        String(serverConf.s3.BUCKET_NAME),
        `mastershop/users/gmf/${idInvoice}.pdf`,
        pdfBuffer
      );
      return httpResponse({
        statusCode: 200,
        body: {
          idInvoice,
          urlFile: `${serverConf.s3.URL_S3}/mastershop/users/gmf/${idInvoice}.pdf`
        }
      });
    }

    return httpResponse({
      statusCode: 200,
      body: {
        idInvoice,
        urlFile: `${serverConf.s3.URL_S3}/mastershop/users/gmf/${idInvoice}.pdf`
      }
    });
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
