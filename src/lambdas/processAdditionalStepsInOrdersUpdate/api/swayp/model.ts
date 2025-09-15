import { OrderSourcesTypes } from "../../types";
import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  updateCancelReason = async ({
    idOrder,
    source
  }: {
    idOrder: number;
    source: string;
  }) => {
    let result: any = false;
    if (source === OrderSourcesTypes.Order) {
      result = await this.dao.updateCancelReason({ idOrder });
    } else {
      console.log("No need to updateCancelReason");
    }
    console.log(
      `updateCancelReason of ${idOrder} is ${result ? "success" : "failed"}`
    );
  };
}

export default Model;
