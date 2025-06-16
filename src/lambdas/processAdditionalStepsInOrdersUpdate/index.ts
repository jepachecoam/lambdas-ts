import controller from "./controller";
import sharedDto from "./dto";
import sharedModel from "./model";
import { Carriers } from "./types";

export const handler = async (event: any, _context: any) => {
  try {
    const { carrier, detail, eventProcess } =
      sharedDto.extractParamsFromEvent(event);

    if (detail) {
      await sharedModel.dispatchShipmentUpdate({
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
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OK" })
    };
  } catch (err: any) {
    console.error(err.message);
    return {
      statusCode: 500,
      body: JSON.stringify("Internal Server Error")
    };
  }
};
