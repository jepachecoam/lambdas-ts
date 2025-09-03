import { checkEnv } from "../../shared/validation/envChecker";
import Dto from "./dto";
import Model from "./model";
import { Envs } from "./types";
import { httpResponse, sendSlackAlert } from "./utils";

export const handler = async (event: any, context: any): Promise<any> => {
  try {
    console.log("Event :>>>", JSON.stringify(event));
    console.log("Context :>>>", JSON.stringify(context));

    checkEnv({ ...Envs });

    const requestParams = Dto.getParams(event);

    if (
      !requestParams.shopifyOrderId ||
      !requestParams.environment ||
      !requestParams.shopifyStoreUrl
    ) {
      return httpResponse({
        statusCode: 400,
        body: {
          message: "Bad request",
          data: null
        }
      });
    }

    if (!requestParams.shopifyAccessToken) {
      return httpResponse({
        statusCode: 400,
        body: {
          message: "Forbiden",
          data: null
        }
      });
    }

    const model = new Model(requestParams.environment);

    const result = await model.normalizeAndProcessOrder(requestParams);

    console.log("Result: >>>", JSON.stringify(result, null, 2));

    if (!result.success) {
      return httpResponse({
        statusCode: 422,
        body: { message: result.message, data: result.data }
      });
    }

    return httpResponse({
      statusCode: 200,
      body: { message: result.message, data: result.data }
    });
  } catch (error) {
    console.error("💥 [ERROR CRITICO] Error no manejado en la lambda:", error);
    await sendSlackAlert({
      logStreamId: context.logStreamName,
      message: "No se normalizo no exito, analizar schema",
      data: error
    });
    return httpResponse({
      statusCode: 500,
      body: { message: "Error interno del servidor", data: null }
    });
  }
};
