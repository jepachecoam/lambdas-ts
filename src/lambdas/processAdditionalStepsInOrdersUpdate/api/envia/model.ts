import { OrderSourcesTypes } from "../../types";
import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }
  updateShipmentUpdate = async ({
    idOrder,
    source
  }: {
    idOrder: number;
    source: string;
  }) => {
    let result: any = false;
    if (source === OrderSourcesTypes.OrderReturn) {
      result = await this.dao.updateReturnShipmentUpdate({
        idOrderReturn: idOrder
      });
    } else {
      result = await this.dao.updateShipmentUpdate({ idOrder });
    }
    console.log(`updateShipmentUpdate ${result}`);
  };
}

export default Model;
