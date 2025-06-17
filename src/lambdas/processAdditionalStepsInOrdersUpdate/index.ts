import { checkEnv } from "../../shared/envChecker";
import { dbEnv } from "../../shared/types";
import handleEnviaRequest from "./api/envia";
import handleSwaypRequest from "./api/swayp";
import handleTccRequest from "./api/tcc";
import dto from "./dto";
import model from "./model";
import { Carriers, EnvsEnum } from "./types";

export const handler = async (event: any, _context: any) => {
  try {
    checkEnv({ ...dbEnv, ...EnvsEnum });
    const { carrier, detail, eventProcess } = dto.extractParamsFromEvent(event);

    if (detail) {
      await model.dispatchShipmentUpdate({
        carrierName: carrier,
        detail: detail
      });
    }

    switch (carrier) {
      case Carriers.tcc:
        await handleTccRequest({ detail, eventProcess });
        break;
      case Carriers.envia:
        await handleEnviaRequest({ detail, eventProcess });
        break;
      case Carriers.swayp:
        await handleSwaypRequest({ detail, eventProcess });
        break;
      default:
        console.log("Not found cases to hanlde for carrier: ", carrier);
    }
    console.log("Finished");
  } catch (err: any) {
    console.error("Error: =>>>", err);
  }
};
