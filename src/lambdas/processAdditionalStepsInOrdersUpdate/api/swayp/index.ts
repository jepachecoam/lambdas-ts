import Model from "./model";
import { SwaypStatusUpdateIds } from "./types";

class Swayp {
  private model: Model;
  constructor(environment: string) {
    this.model = new Model(environment);
  }

  handleSwaypRequest = async ({ detail }: any) => {
    const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;

    if (
      idCarrierStatusUpdate === SwaypStatusUpdateIds.Cancelacion ||
      idCarrierStatusUpdate === SwaypStatusUpdateIds.Cancelada
    ) {
      await this.model.updateCancelReason(detail);
    } else {
      console.log("Process not found ");
    }
  };
}

export default Swayp;
