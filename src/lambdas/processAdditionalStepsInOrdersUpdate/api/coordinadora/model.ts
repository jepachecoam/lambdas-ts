import { OrderSourcesTypes } from "../../types";
import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  reexpeditionProcess = async (detail: any) => {
    const source: any = detail.source;
    if (
      source !== OrderSourcesTypes.OrderReturn ||
      source !== OrderSourcesTypes.OrderReturnLeg
    ) {
      return null;
    }

    const payload = {
      ...detail,
      status: {
        statusCode: "301",
        statusName: "REEXPEDICION DETECTADA POR EL SISTEMA"
      }
    };

    await this.dao.sendToUpdateOrderQueue(payload);
  };
}

export default Model;
