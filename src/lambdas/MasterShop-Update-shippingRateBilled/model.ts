import Dao from "./dao";
import { IProcessInput, IProcessResult } from "./types";

class Model {
  private dao: Dao;

  constructor(dao: Dao) {
    this.dao = dao;
  }

  process = async (params: IProcessInput): Promise<IProcessResult> => {
    try {
      console.log("Model.process params:", params);

      const response = await this.dao.callCarrierChargeValidate(params);

      console.log("Carrier charge validate response:", response);

      if (!response.result) {
        throw new Error(
          `Carrier charge validate failed: ${response.message} (codeResponse: ${response.codeResponse})`
        );
      }

      const shippingRateBilled = response.data!;

      await this.dao.updateOrderCarrierInfo({
        idOrder: params.idOrder,
        shippingRateBilled
      });

      return { success: true, idOrder: params.idOrder };
    } catch (error) {
      console.error("Error in Model.process:", error);
      throw error;
    }
  };
}

export default Model;
