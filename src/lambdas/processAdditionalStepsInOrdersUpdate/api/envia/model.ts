import { OrderSourcesTypes } from "../../types";
import Dao from "./dao";
import { IRecord, recordSchema } from "./types";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }
  updateShipmentUpdate = async ({
    idOrder,
    source
  }: {
    idOrder: number;
    source: string;
  }) => {
    let result: any = false;
    if (source === OrderSourcesTypes.OrderReturn) {
      result = await this.dao.updateReturnShipmentUpdate({
        idOrderReturn: idOrder
      });
    } else {
      result = await this.dao.updateShipmentUpdate({ idOrder });
    }
    console.log(`updateShipmentUpdate ${result}`);
  };

  redirectionProcess = async (detail: any) => {
    const validation = recordSchema.safeParse(detail);
    if (!validation.success) {
      console.log("Record validation failed:", validation.error.message);
      return;
    }

    const data: IRecord = validation.data;

    const status = await this.dao.getStatusGuide({
      carrierTrackingCode: data.trackingNumber
    });

    const linkedCarrierTrackingCode =
      status?.linkedShipment?.likedCarrierTrackingCode;
    if (!linkedCarrierTrackingCode) {
      console.log("linkedCarrierTrackingCode not found");
      return null;
    }

    const payload: IRecord = {
      carrierData: data.carrierData,
      carrierName: data.carrierName,
      trackingNumber: data.trackingNumber,
      status: {
        statusCode: "301",
        statusName: "REEXPEDICION DETECTADA POR EL SISTEMA"
      },
      novelty: { noveltyCode: null },
      returnProcess: { returnTrackingNumber: null },
      linkedShipment: {
        linkedCarrierTrackingCode: linkedCarrierTrackingCode
      }
    };

    console.log("status", status);
    const response = await this.dao.sendToUpdateOrderQueue(payload);
    console.log("Response from updateOrderQueue :>>>", response);
  };
}

export default Model;
