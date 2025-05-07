import axios from "axios";

import sharedDao from "../dao/sharedDao";
import sharedDto from "../dto/sharedDto";

const insertNewTrackingCodeIfFound = async ({ data, config }: any) => {
  try {
    const { idOrder, carrierData, trackingNumber } = data;

    const newTrackingNumbers = sharedDto.getTrackingNumbersFromText({
      text: carrierData,
      exclusions: [trackingNumber],
      config: config
    });
    if (!newTrackingNumbers.length) {
      console.log("No new tracking numbers found");
      return null;
    }

    const newCarrierTrackingCode = newTrackingNumbers[0];

    const result = await sharedDao.createCarrierTrackingCodeHistory({
      idOrder,
      newCarrierTrackingCode
    });

    if (result) {
      console.log(`Tracking number ${newCarrierTrackingCode} already exists`);
      return null;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const dispatchShipmentUpdate = async ({ carrierName, detail }: any) => {
  try {
    let mainOrder: any = null;
    let returnData: any = null;
    let orderLogistic = null;
    let shipmentUpdateInfo = null;

    if (detail.source === "orderReturn") {
      returnData = await sharedDao.getOrderReturn({
        idOrderReturn: detail.idOrder
      });
      if (returnData) {
        mainOrder = await sharedDao.getOrder({ idOrder: returnData.idOrder });
      }
    } else {
      mainOrder = await sharedDao.getOrder({ idOrder: detail.idOrder });
    }

    if (mainOrder) {
      orderLogistic = await fetchMainOrder({
        idUser: mainOrder.idUser,
        idBusiness: mainOrder.idBusiness,
        idOrder: mainOrder.idOrder
      });
    }

    const carrierStatusUpdate = await sharedDao.getCarrierStatusUpdateById({
      idCarrierStatusUpdate: detail.idCarrierStatusUpdate,
      idCarrier: detail.idCarrier
    });

    if (detail && detail.idShipmentUpdate) {
      shipmentUpdateInfo = await sharedDao.getShipmentUpdateInfoById({
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

    const sendEventResult = await sharedDao.sendEvent({
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
      `${process.env["URL_MS"]}/api/b2b/logistics/order/${idUser}`,
      parameter,
      {
        headers: {
          "x-app-name": `${process.env["APP_NAME_MS"]}`,
          "x-api-key": `${process.env["API_KEY_MS"]}`
        }
      }
    );
    return objectResp.data.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default { insertNewTrackingCodeIfFound, dispatchShipmentUpdate };
