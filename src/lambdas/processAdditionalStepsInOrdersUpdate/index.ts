import { checkEnv } from "../../shared/envChecker";
import http from "../../shared/http";
import controller from "./controller";
import sharedDto from "./dto";
import Model from "./model";
import { Carriers, Envs } from "./types";

export const handler = async (event: any, _context: any) => {
  try {
    checkEnv(Envs);
    const model = new Model();
    const { carrier, detail, eventProcess } =
      sharedDto.extractParamsFromEvent(event);

    if (detail) {
      await model.dispatchShipmentUpdate({
        carrierName: carrier,
        detail: detail
      });
    }

    switch (carrier) {
      case Carriers.tcc:
        await controller.handleTccRequest({ detail, eventProcess });
        break;
      case Carriers.envia:
        await controller.handleEnviaRequest({ detail, eventProcess });
        break;
      case Carriers.swayp:
        await controller.handleSwaypRequest({ detail, eventProcess });
        break;
      default:
        throw new Error("Carrier not found");
    }
    return http.jsonResponse({ statusCode: 200, message: "OK", result: {} });
  } catch (err: any) {
    console.error(err.message);
    return http.jsonResponse({
      statusCode: 500,
      message: "Internal Server Error",
      result: {}
    });
  }
};
