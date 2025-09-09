import { OrderSourcesTypes } from "../../types";
import Dao from "./dao";
import { IRecord, recordSchema } from "./types";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  reexpeditionProcess = async (detail: any): Promise<void> => {
    const validation = recordSchema.safeParse(detail);
    if (!validation.success) {
      console.log("Record validation failed:", validation.error.message);
      return;
    }

    const data: IRecord = validation.data;
    const source = data.source;
    if (
      source === OrderSourcesTypes.Order ||
      source === OrderSourcesTypes.OrderLeg
    ) {
      console.log(
        "Source of reexpedition process should be OrderReturn/OrderReturnLeg"
      );
      return;
    }

    if (!data.linkedShipment.linkedCarrierTrackingCode) {
      console.log(
        "LinkedShipment not found and reexpedition process not valid"
      );
      return;
    }

    const payload: IRecord = {
      carrierData: data.carrierData,
      carrierName: data.carrierName,
      trackingNumber: data.linkedShipment.linkedCarrierTrackingCode,
      status: {
        statusCode: "301",
        statusName: "REEXPEDICION DETECTADA POR EL SISTEMA"
      },
      novelty: data.novelty,
      returnProcess: data.returnProcess,
      linkedShipment: data.linkedShipment,
      source: data.source
    };

    const response = await this.dao.sendToUpdateOrderQueue(payload);
    console.log("Response from updateOrderQueue :>>>", response);
  };
}

export default Model;
