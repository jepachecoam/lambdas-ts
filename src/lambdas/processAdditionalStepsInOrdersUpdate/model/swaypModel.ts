import swaypDao from "../dao/swaypDao";
import constants from "../utils/const";

const updateCancelReason = async ({
  idOrder,
  source
}: {
  idOrder: number;
  source: string;
}) => {
  try {
    let result = false;
    if (source === constants.OrderSourcesTypes.Order) {
      result = await swaypDao.updateCancelReason({ idOrder });
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
