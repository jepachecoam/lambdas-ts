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
      source === OrderSourcesTypes.OrderReturn ||
      source === OrderSourcesTypes.OrderReturnLeg
    ) {
      await this.dao.sendToUpdateOrderQueue({ example: "" });
    } else {
      console.log("No need to updateCancelReason");
    }
  };
}

export default Model;
