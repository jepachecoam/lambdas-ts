import { OrderSourcesTypes } from "../../types";
import dao from "./dao";

const updateCancelReason = async ({
  idOrder,
  source
}: {
  idOrder: number;
  source: string;
}) => {
  let result: any = false;
  if (source === OrderSourcesTypes.Order) {
    result = await dao.updateCancelReason({ idOrder });
  } else {
    console.log("No need to updateCancelReason");
  }
  console.log(
    `updateCancelReason of ${idOrder} is ${result ? "success" : "failed"}`
  );
};

export default { updateCancelReason };
