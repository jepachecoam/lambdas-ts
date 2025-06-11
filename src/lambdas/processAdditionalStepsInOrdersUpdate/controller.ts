import enviaModel from "./model/enviaModel";
import swaypModel from "./model/swaypModel";
import constants from "./utils/const";

const handleTccRequest = async ({ detail }: any) => {
  console.log("handleTccRequest...");
  console.log("detail =>>>", detail);
};

const handleEnviaRequest = async ({ detail }: any) => {
  try {
    console.log("handleEnviaRequest...");

    const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;

    switch (idCarrierStatusUpdate) {
      case constants.EnviaCarrierStatusUpdateIds.SolucionadoEnMalla:
        await enviaModel.updateShipmentUpdate(detail);
        break;
      default:
        console.log("Process not found ");
        break;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const handleSwaypRequest = async ({ detail }: any) => {
  console.log("handleSwaypRequest...");

  const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;

  switch (idCarrierStatusUpdate) {
    case constants.SwaypStatusUpdateIds.Cancelacion ||
      constants.SwaypStatusUpdateIds.Cancelada:
      await swaypModel.updateCancelReason(detail);
      break;

    default:
      break;
  }
};

export default {
  handleTccRequest,
  handleEnviaRequest,
  handleSwaypRequest
};
