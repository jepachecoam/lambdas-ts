import { OrderSourcesTypes } from "../../types";
import dao from "./dao";

const updateShipmentUpdate = async ({
  idOrder,
  source
}: {
  idOrder: number;
  source: string;
}) => {
  try {
    let result = false;
    if (source === OrderSourcesTypes.OrderReturn) {
      result = await dao.updateReturnShipmentUpdate({
        idOrderReturn: idOrder
      });
    } else {
      result = await dao.updateShipmentUpdate({ idOrder });
    }
    console.log(`updateShipmentUpdate ${result}`);
  } catch {
    console.log("error");
  }
};

export default { updateShipmentUpdate };
