import Model from "./model";
import { EnviaCarrierStatusCode } from "./types";

class Envia {
  private model: Model;
  constructor(environment: string) {
    this.model = new Model(environment);
  }
  handleEnviaRequest = async ({ detail }: any) => {
    const carrierCode = String(detail?.status?.statusCode);

    switch (carrierCode) {
      case EnviaCarrierStatusCode.SolucionadoEnMalla:
        await this.model.updateShipmentUpdate(detail);
        break;

      case EnviaCarrierStatusCode.Redireccionando:
        await this.model.redirectionProcess(detail);
        break;
      default:
        console.log("Process not found ");
        break;
    }
  };
}
export default Envia;
