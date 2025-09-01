import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";
import { EnvsEnum } from "./types";

export const handler = async (event: any, _context: any) => {
  try {
    checkEnv({ ...dbEnv, ...EnvsEnum });
    const { carrier, detail, eventProcess, environment } =
      dto.extractParamsFromEvent(event);

    const model = new Model(environment);

    if (detail && !eventProcess) {
      await model.dispatchShipmentUpdate({
        carrierName: carrier,
        detail: detail
      });
    }

    await model.routeRequestToCarrier({
      detail: detail,
      carrierName: carrier,
      eventProcess: eventProcess
    });

    console.log("Finished");
  } catch (err: any) {
    console.error("Error: =>>>", err);
  }
};
