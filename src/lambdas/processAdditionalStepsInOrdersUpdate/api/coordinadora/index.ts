import Model from "./model";
import { CarrierCodes } from "./types";

class Coordinadora {
  private model: Model;
  constructor(environment: string) {
    this.model = new Model(environment);
  }

  handleCoordinadoraRequest = async ({ detail }: any) => {
    const carrierCode = detail?.status?.statusCode;
    if (carrierCode === CarrierCodes.CerradoPorIncidencia) {
      await this.model.reexpeditionProcess(detail);
    } else {
      console.log("Process not found ");
    }
  };
}

export default Coordinadora;
