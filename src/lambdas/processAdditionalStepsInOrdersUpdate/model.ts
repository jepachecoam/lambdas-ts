import Coordinadora from "./api/coordinadora";
import Envia from "./api/envia";
import Swayp from "./api/swayp";
import Tcc from "./api/tcc";
import Dao from "./dao";
import { Carriers, OrderSourcesTypes } from "./types";

class Model {
  private dao: Dao;
  private envia: Envia;
  private tcc: Tcc;
  private swayp: Swayp;
  private coordinadora: Coordinadora;
  constructor(environment: string) {
    this.dao = new Dao(environment);
    this.envia = new Envia(environment);
    this.tcc = new Tcc(environment);
    this.swayp = new Swayp(environment);
    this.coordinadora = new Coordinadora(environment);
  }

  routeRequestToCarrier = async ({
    carrierName,
    detail,
    eventProcess
  }: any) => {
    switch (carrierName) {
      case Carriers.tcc:
        await this.tcc.handleTccRequest({ detail, eventProcess });
        break;
      case Carriers.envia:
        await this.envia.handleEnviaRequest({ detail, eventProcess });
        break;
      case Carriers.swayp:
        await this.swayp.handleSwaypRequest({ detail, eventProcess });
        break;
      case Carriers.coordinadora:
        await this.coordinadora.handleCoordinadoraRequest({
          detail,
          eventProcess
        });
        break;
      default:
        console.log("Not found cases to hanlde for carrier: ", carrierName);
    }
  };

  dispatchShipmentUpdate = async ({ carrierName, detail }: any) => {
    try {
      let mainOrder: any = null;
      let returnData: any = null;
      let orderLogistic = null;
      let shipmentUpdateInfo = null;

      if (
        detail.source === OrderSourcesTypes.OrderReturn ||
        detail.source === OrderSourcesTypes.OrderReturnLeg
      ) {
        returnData = await this.dao.getOrderReturn({
          idOrderReturn: detail.idOrderReturn
        });
      }
      mainOrder = await this.dao.getOrder({ idOrder: detail.idOrder });

      if (mainOrder) {
        orderLogistic = await this.dao.fetchMainOrder({
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

      const sendEventResult = await this.dao.sendEvent({
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
}

export default Model;
