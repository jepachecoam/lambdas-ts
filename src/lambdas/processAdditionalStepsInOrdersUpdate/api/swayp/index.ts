import Model from "./model";
import { SwaypStatusCode } from "./types";

class Swayp {
  private model: Model;
  constructor(environment: string) {
    this.model = new Model(environment);
  }

  handleSwaypRequest = async ({ detail }: any) => {
    const carrierCode = String(detail?.status?.statusCode);

    switch (carrierCode) {
      case SwaypStatusCode.Cancelacion:
      case SwaypStatusCode.Cancelada:
        await this.model.updateCancelReason(detail);
        break;

      default:
        console.log("Process not found ");
        break;
    }
  };
}

export default Swayp;
