import { OrderSourcesTypes } from "../../types";
import dao from "./dao";

const updateCancelReason = async ({
  idOrder,
  source
}: {
  idOrder: number;
  source: string;
}) => {
  try {
    let result = false;
    if (source === OrderSourcesTypes.Order) {
      result = await dao.updateCancelReason({ idOrder });
    } else {
      console.log("No need to updateCancelReason");
    }
    console.log(
      `updateCancelReason of ${idOrder} is ${result ? "success" : "failed"}`
    );
  } catch (error) {
    console.log("error in Model updateShipmentUpdate", error);
  }
};

export default { updateCancelReason };
