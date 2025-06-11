import controller from "./controller";
import sharedDto from "./dto/sharedDto";
import sharedModel from "./model/sharedModel";
import sharedUtils from "./utils/const";

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

    const { Carriers } = sharedUtils;

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
    console.log("Finished processAdditionalStepsInOrdersUpdate");
  } catch (err) {
    console.error("Error:", err);
  }
};
