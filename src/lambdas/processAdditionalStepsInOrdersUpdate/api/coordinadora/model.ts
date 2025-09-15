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

    if (!data.returnProcess.returnTrackingNumber) {
      console.log("returnProcess not found");
      return;
    }

    if (data.trackingNumber === data.returnProcess.returnTrackingNumber) {
      console.log("Tracking number is the same as return tracking number");
      return;
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
        linkedCarrierTrackingCode: data.returnProcess.returnTrackingNumber
      },
      updateSource: "aditional_steps"
    };

    const response = await this.dao.sendToUpdateOrderQueue(payload);
    console.log("Response from updateOrderQueue :>>>", response);
  };
}

export default Model;
