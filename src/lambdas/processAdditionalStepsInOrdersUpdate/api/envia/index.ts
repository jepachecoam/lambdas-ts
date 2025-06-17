import model from "./model";
import { EnviaCarrierStatusUpdateIds } from "./types";

const handleEnviaRequest = async ({ detail }: any) => {
  const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;
  if (
    idCarrierStatusUpdate === EnviaCarrierStatusUpdateIds.SolucionadoEnMalla
  ) {
    await model.updateShipmentUpdate(detail);
  } else {
    console.log("Process not found ");
  }
};

export default handleEnviaRequest;
