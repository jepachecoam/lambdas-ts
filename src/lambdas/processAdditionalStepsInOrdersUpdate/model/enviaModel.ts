import enviaDao from "../dao/enviaDao";

const updateShipmentUpdate = async ({
  idOrder,
  source
}: {
  idOrder: number;
  source: string;
}) => {
  try {
    let result = false;
    if (source === "orderReturn") {
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
