import model from "./model";
import { SwaypStatusUpdateIds } from "./types";

const handleSwaypRequest = async ({ detail }: any) => {
  const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;

  if (
    idCarrierStatusUpdate === SwaypStatusUpdateIds.Cancelacion ||
    idCarrierStatusUpdate === SwaypStatusUpdateIds.Cancelada
  ) {
    await model.updateCancelReason(detail);
  } else {
    console.log("Process not found ");
  }
};

export default handleSwaypRequest;
