import Dao from "./dao";
import { IProcessInput, IProcessResult } from "./types";

class Model {
  private dao: Dao;

  constructor(dao: Dao) {
    this.dao = dao;
  }

  process = async ({
    idOrder
  }: {
    idOrder: number;
  }): Promise<IProcessResult> => {
    try {
      console.log("Model.process idOrder:", idOrder);

      const orderData = await this.dao.getOrderData(idOrder);

      if (!orderData) {
        throw new Error("Order Data not found");
      }

      console.log("Order data:", JSON.stringify(orderData, null, 2));

      const { carrierInfo } = orderData;

      const params: IProcessInput = {
        idCarrier: orderData.idCarrier,
        idOrder,
        orderStatus: "returned",
        paymentMethod: orderData.paymentMethod,
        agreementType: carrierInfo?.extraData?.insuredValueReturn
          ? "carrierReturnShield"
          : "none",
        billingFactors: {
          profitMargin: carrierInfo?.profitMargin ?? 0,
          shippingRate: orderData.shippingRateQuoted,
          collectionFee: carrierInfo?.collectionFee ?? 0,
          insuredValueReturn: carrierInfo?.extraData?.insuredValueReturn ?? 0
        }
      };

      console.log("Model.process params:", JSON.stringify(params, null, 2));

      const response = await this.dao.callCarrierChargeValidate(params);

      console.log(
        "Carrier charge validate response:",
        JSON.stringify(response, null, 2)
      );

      if (!response.result) {
        throw new Error(
          `Carrier charge validate failed: ${response.message} (codeResponse: ${response.codeResponse})`
        );
      }

      const shippingRateBilled = response.data!;

      await this.dao.updateOrderCarrierInfo({
        idOrder,
        shippingRateBilled
      });

      return { success: true, idOrder };
    } catch (error) {
      console.error("Error in Model.process:", error);
      throw error;
    }
  };
}

export default Model;
