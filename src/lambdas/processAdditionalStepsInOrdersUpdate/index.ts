import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";
import { EnvsEnum } from "./types";
import { clientSlackNotification } from "./utils/request";

export const handler = async (event: any, context: any) => {
  try {
    checkEnv({ ...dbEnv, ...EnvsEnum });
    const { carrier, detail, eventProcess, environment } =
      dto.extractParamsFromEvent(event);

    const model = new Model(environment);

    // if (detail && !eventProcess) {
    //   await model.dispatchShipmentUpdate({
    //     carrierName: carrier,
    //     detail: detail
    //   });
    // }

    await model.routeRequestToCarrier({
      detail: detail,
      carrierName: carrier,
      eventProcess: eventProcess
    });

    console.log("Finished");

    return {
      statusCode: 200,
      body: "OK"
    };
  } catch (err: any) {
    console.error("Error: =>>>", err);

    clientSlackNotification.post("", {
      logStreamId: context.logStreamName,
      error: "Unexpected error in process aditional Steps"
    });

    return {
      statusCode: 500,
      body: err.message
    };
  }
};
