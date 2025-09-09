import Model from "./model";
import { CarrierCodes } from "./types";

class Coordinadora {
  private model: Model;
  constructor(environment: string) {
    this.model = new Model(environment);
  }

  handleCoordinadoraRequest = async ({ detail }: any) => {
    const carrierCode = String(detail?.status?.statusCode);

    switch (carrierCode) {
      case CarrierCodes.CerradoPorIncidencia:
        await this.model.reexpeditionProcess(detail);
        break;
      default:
        console.log("Process not found ");
        break;
    }
  };
}

export default Coordinadora;
