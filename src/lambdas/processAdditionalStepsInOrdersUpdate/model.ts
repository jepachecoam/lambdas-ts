import axios from "axios";

import { envs } from "./conf/envs";
import dao from "./dao";

const dispatchShipmentUpdate = async ({ carrierName, detail }: any) => {
  try {
    let mainOrder: any = null;
    let returnData: any = null;
    let orderLogistic = null;
    let shipmentUpdateInfo = null;

    if (detail.source === "orderReturn") {
      returnData = await dao.getOrderReturn({
        idOrderReturn: detail.idOrder
      });
      if (returnData) {
        mainOrder = await dao.getOrder({ idOrder: returnData.idOrder });
      }
    } else {
      mainOrder = await dao.getOrder({ idOrder: detail.idOrder });
    }

    if (mainOrder) {
      orderLogistic = await fetchMainOrder({
        idUser: mainOrder.idUser,
        idBusiness: mainOrder.idBusiness,
        idOrder: mainOrder.idOrder
      });
    }

    const carrierStatusUpdate = await dao.getCarrierStatusUpdateById({
      idCarrierStatusUpdate: detail.idCarrierStatusUpdate,
      idCarrier: detail.idCarrier
    });

    if (detail && detail.idShipmentUpdate) {
      shipmentUpdateInfo = await dao.getShipmentUpdateInfoById({
        idShipmentUpdate: detail.idShipmentUpdate,
        idCarrier: detail.idCarrier
      });
    }

    const payloadEvent = {
      carrierName,
      detail,
      carrierStatusUpdateData: carrierStatusUpdate,
      shipmentUpdateInfo: shipmentUpdateInfo,
      orderLogisticData: orderLogistic,
      returnData: returnData
    };

    console.log(
      "dispatchShipmentUpdate payload =>>>",
      JSON.stringify(payloadEvent)
    );

    const sendEventResult = await dao.sendEvent({
      source: "MASTERSHOP-SHIPMENT-UPDATE",
      detailType: `SHIPMENT-UPDATE-${carrierName.toUpperCase()}`,
      detail: payloadEvent
    });

    return sendEventResult;
  } catch (err) {
    console.error("Error sending event:", err);
    throw err;
  }
};

const fetchMainOrder = async ({ idUser, idOrder, idBusiness }: any) => {
  try {
    const parameter = {
      orderId: idOrder,
      idBussiness: idBusiness
    };
    const objectResp = await axios.post(
      `${envs.URL_MS}/${envs.environment}/api/b2b/logistics/order/${idUser}`,
      parameter,
      {
        headers: {
          "x-app-name": envs.APP_NAME_MS,
          "x-api-key": envs.API_KEY_MS
        }
      }
    );
    return objectResp.data.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default { dispatchShipmentUpdate };
