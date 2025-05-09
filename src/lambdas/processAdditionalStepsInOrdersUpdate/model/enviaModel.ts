import enviaDao from "../dao/enviaDao";
import constants from "../utils/const";

const updateShipmentUpdate = async ({
  idOrder,
  source
}: {
  idOrder: number;
  source: string;
}) => {
  try {
    let result = false;
    if (source === constants.OrderSourcesTypes.OrderReturn) {
      result = await enviaDao.updateReturnShipmentUpdate({
        idOrderReturn: idOrder
      });
    } else {
      result = await enviaDao.updateShipmentUpdate({ idOrder });
    }
    console.log(`updateShipmentUpdate ${result}`);
  } catch {
    console.log("error");
  }
};

export default { updateShipmentUpdate };
