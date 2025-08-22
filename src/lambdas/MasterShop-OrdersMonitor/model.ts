import Dao from "./dao";
import utils from "./utils";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  getOrdersToUpdate = async ({ idCarrier }: { idCarrier: number }) => {
    try {
      const ordersToUpdate = await this.dao.getOrdersToUpdate({ idCarrier });
      const ordersReturnToUpdate = await this.dao.getOrdersReturnToUpdate({
        idCarrier
      });

      const result = [];

      if (
        Array.isArray(ordersReturnToUpdate) &&
        ordersReturnToUpdate.length > 1
      ) {
        result.push(...ordersReturnToUpdate);
      }

      if (Array.isArray(ordersToUpdate) && ordersToUpdate.length > 1) {
        result.push(...ordersToUpdate);
      }

      return result;
    } catch (error) {
      console.error("Error in getOrdersToUpdate model =>>>", error);
      throw error;
    }
  };

  fetchOrdersResponses = async ({
    ordersToUpdate,
    batchSizeToFetch,
    carrierName
  }: {
    ordersToUpdate: any;
    batchSizeToFetch: number;
    carrierName: number;
  }) => {
    try {
      const orderPromises = ordersToUpdate.map(
        (order: any) => async () =>
          this.dao.fetchGuideEndpoint({
            carrierTrackingCode: order.carrierTrackingCode,
            carrier: carrierName
          })
      );
      return await utils.executeWithLimit({
        tasks: orderPromises,
        logReference: "fetchOrdersResponses model",
        concurrencyLimit: Number(batchSizeToFetch)
      });
    } catch (error) {
      console.error("Error in fetchOrdersResponses model =>>>", error);
      throw error;
    }
  };

  sendCarrierDataToUpdateOrder = async ({
    ordersResponsesParsed,
    batchSizeToSend
  }: {
    ordersResponsesParsed: any;
    batchSizeToSend: any;
  }) => {
    try {
      const processedGuides = ordersResponsesParsed.map(
        (carrierData: any) => async () =>
          this.dao.sendCarrierDataToUpdateOrder({ carrierData })
      );
      await utils.executeWithLimit({
        tasks: processedGuides,
        logReference: "sendCarrierDataToUpdateOrder model",
        concurrencyLimit: parseInt(batchSizeToSend, 10)
      });
    } catch (error) {
      console.error("Error in sendCarrierDataToUpdateOrder model =>>>", error);
      throw error;
    }
  };
}

export default Model;
