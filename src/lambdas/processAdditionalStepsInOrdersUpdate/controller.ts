import EnviaModel from "./api/envia/model";
import { EnviaCarrierStatusUpdateIds } from "./api/envia/types";
import SwaypModel from "./api/swayp/model";
import { SwaypStatusUpdateIds } from "./api/swayp/types";
import TccModel from "./api/tcc/model";

const handleTccRequest = async ({ eventProcess }: any) => {
  if (eventProcess === "CRONJOB-IDNOVEDAD") {
    const tccModel = new TccModel();
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
    const enviaModel = new EnviaModel();
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
    const swaypModel = new SwaypModel();
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
