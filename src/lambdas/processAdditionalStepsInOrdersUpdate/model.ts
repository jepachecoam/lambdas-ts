import axios from "axios";

import Envia from "./api/envia";
import Swayp from "./api/swayp";
import Tcc from "./api/tcc";
import { envs } from "./conf/envs";
import Dao from "./dao";
import { Carriers } from "./types";

class Model {
  private dao: Dao;
  private envia: Envia;
  private tcc: Tcc;
  private swayp: Swayp;
  constructor(environment: string) {
    this.dao = new Dao(environment);
    this.envia = new Envia(environment);
    this.tcc = new Tcc(environment);
    this.swayp = new Swayp(environment);
  }

  routeRequestToCarrier = async ({ carrier, detail, eventProcess }: any) => {
    switch (carrier) {
      case Carriers.tcc:
        await this.tcc.handleTccRequest({ detail, eventProcess });
        break;
      case Carriers.envia:
        await this.envia.handleEnviaRequest({ detail, eventProcess });
        break;
      case Carriers.swayp:
        await this.swayp.handleSwaypRequest({ detail, eventProcess });
        break;
      default:
        console.log("Not found cases to hanlde for carrier: ", carrier);
    }
  };

  dispatchShipmentUpdate = async ({ carrierName, detail }: any) => {
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
        orderLogistic = await this.fetchMainOrder({
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

  private fetchMainOrder = async ({ idUser, idOrder, idBusiness }: any) => {
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
}

export default Model;
