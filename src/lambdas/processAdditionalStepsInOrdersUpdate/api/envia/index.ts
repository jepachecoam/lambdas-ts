import Model from "./model";
import { EnviaCarrierStatusUpdateIds } from "./types";

class Envia {
  private model: Model;
  constructor(environment: string) {
    this.model = new Model(environment);
  }
  handleEnviaRequest = async ({ detail }: any) => {
    const idCarrierStatusUpdate = detail.idCarrierStatusUpdate;
    if (
      idCarrierStatusUpdate === EnviaCarrierStatusUpdateIds.SolucionadoEnMalla
    ) {
      await this.model.updateShipmentUpdate(detail);
    } else {
      console.log("Process not found ");
    }
  };
}
export default Envia;
