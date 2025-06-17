import { OrderSourcesTypes } from "../../types";
import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor() {
    this.dao = new Dao();
  }

  async updateCancelReason({
    idOrder,
    source
  }: {
    idOrder: number;
    source: string;
  }) {
    try {
      let result = false;
      if (source === OrderSourcesTypes.Order) {
        result = await this.dao.updateCancelReason({ idOrder });
      } else {
        console.log("No need to updateCancelReason");
      }
      console.log(
        `updateCancelReason of ${idOrder} is ${result ? "success" : "failed"}`
      );
    } catch (error) {
      console.log("error in Model updateShipmentUpdate", error);
    }
  }
}

export default Model;
