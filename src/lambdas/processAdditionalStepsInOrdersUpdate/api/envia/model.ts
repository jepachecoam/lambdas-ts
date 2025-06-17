import { OrderSourcesTypes } from "../../types";
import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor() {
    this.dao = new Dao();
  }

  async updateShipmentUpdate({
    idOrder,
    source
  }: {
    idOrder: number;
    source: string;
  }) {
    try {
      let result = false;
      if (source === OrderSourcesTypes.OrderReturn) {
        result = await this.dao.updateReturnShipmentUpdate({
          idOrderReturn: idOrder
        });
      } else {
        result = await this.dao.updateShipmentUpdate({ idOrder });
      }
      console.log(`updateShipmentUpdate ${result}`);
    } catch {
      console.log("error");
    }
  }
}

export default Model;
