import enviaModel from "./api/envia/model";
import { EnviaCarrierStatusUpdateIds } from "./api/envia/types";
import swaypModel from "./api/swayp/model";
import { SwaypStatusUpdateIds } from "./api/swayp/types";
import tccModel from "./api/tcc/model";

const handleTccRequest = async ({ eventProcess }: any) => {
  if (eventProcess === "CRONJOB-IDNOVEDAD") {
    await tccModel.insertIncidentId();
  } else {
    console.log("Process not found ");
  }
};

const handleEnviaRequest = async ({ detail }: any) => {
  const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;
  if (
    idCarrierStatusUpdate === EnviaCarrierStatusUpdateIds.SolucionadoEnMalla
  ) {
    await enviaModel.updateShipmentUpdate(detail);
  } else {
    console.log("Process not found ");
  }
};

const handleSwaypRequest = async ({ detail }: any) => {
  const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;

  if (
    idCarrierStatusUpdate === SwaypStatusUpdateIds.Cancelacion ||
    idCarrierStatusUpdate === SwaypStatusUpdateIds.Cancelada
  ) {
    await swaypModel.updateCancelReason(detail);
  } else {
    console.log("Process not found ");
  }
};

export default {
  handleTccRequest,
  handleEnviaRequest,
  handleSwaypRequest
};
