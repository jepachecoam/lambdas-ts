import httpResponse from "../../shared/responses/http";
import { checkEnv } from "../../shared/validation/envChecker";
import Dto from "./dto";
import Model from "./model";
import { Envs } from "./types";
import { sendSlackAlert } from "./utils";

export const handler = async (event: any, context: any): Promise<any> => {
  try {
    console.log("Event :>>>", JSON.stringify(event));
    console.log("Context :>>>", JSON.stringify(context));

    checkEnv({ ...Envs });

    const requestParams = Dto.getParams(event);

    const { shopifyAccessToken, shopifyStoreUrl, shopifyOrderId, environment } =
      requestParams;

    if (!shopifyOrderId || !environment || !shopifyStoreUrl) {
      return httpResponse({
        statusCode: 400,
        body: {
          message: "Bad request",
          data: null
        }
      });
    }

    if (!shopifyAccessToken) {
      return httpResponse({
        statusCode: 400,
        body: {
          message: "Forbiden",
          data: null
        }
      });
    }

    const model = new Model(environment);

    const result = await model.normalizeShopifyOrder({
      orderId: shopifyOrderId,
      accessToken: shopifyAccessToken,
      storeUrl: shopifyStoreUrl
    });

    console.log("Result: >>>", JSON.stringify(result, null, 2));

    if (result.success) {
      return httpResponse({
        statusCode: 200,
        body: { message: result.message, data: result.data }
      });
    } else {
      await sendSlackAlert({
        logStreamId: context.logStreamName,
        message: "No se normalizo no exito, analizar schema",
        data: result
      });
      return httpResponse({
        statusCode: 422,
        body: { message: result.message, data: null }
      });
    }
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
