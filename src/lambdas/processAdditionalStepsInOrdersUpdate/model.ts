import Dao from "./dao";
import Request from "./request";

class Model {
  private dao: Dao;
  private request: Request;

  constructor() {
    this.dao = new Dao();
    this.request = new Request();
  }

  async dispatchShipmentUpdate({ carrierName, detail }: any) {
    try {
      let mainOrder: any = null;
      let returnData: any = null;
      let orderLogistic = null;
      let shipmentUpdateInfo = null;

      if (detail.source === "orderReturn") {
        returnData = await this.dao.getOrderReturn({
          idOrderReturn: detail.idOrder
        });
        if (returnData) {
          mainOrder = await this.dao.getOrder({ idOrder: returnData.idOrder });
        }
      } else {
        mainOrder = await this.dao.getOrder({ idOrder: detail.idOrder });
      }

      if (mainOrder) {
        orderLogistic = await this.request.fetchMainOrder({
          idUser: mainOrder.idUser,
          idBusiness: mainOrder.idBusiness,
          idOrder: mainOrder.idOrder
        });
      }

      const carrierStatusUpdate = await this.dao.getCarrierStatusUpdateById({
        idCarrierStatusUpdate: detail.idCarrierStatusUpdate,
        idCarrier: detail.idCarrier
      });

      if (detail && detail.idShipmentUpdate) {
        shipmentUpdateInfo = await this.dao.getShipmentUpdateInfoById({
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

      const sendEventResult = await this.request.sendEvent({
        source: "MASTERSHOP-SHIPMENT-UPDATE",
        detailType: `SHIPMENT-UPDATE-${carrierName.toUpperCase()}`,
        detail: payloadEvent
      });

      return sendEventResult;
    } catch (err) {
      console.error("Error sending event:", err);
      throw err;
    }
  }
}

export default Model;
