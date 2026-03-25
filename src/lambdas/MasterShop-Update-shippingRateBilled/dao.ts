import axios from "axios";

import Database from "../../shared/databases/sequelize";
import { envs } from "./conf/envs";
import {
  ICarrierChargeResponse,
  IProcessInput,
  IShippingRateBilled
} from "./types";

class Dao {
  private db: Database;

  constructor(environment: string) {
    this.db = new Database(environment);
  }

  callCarrierChargeValidate = async (
    params: IProcessInput
  ): Promise<ICarrierChargeResponse> => {
    try {
      const response = await axios.post<ICarrierChargeResponse>(
        `${envs.BASE_URL_MS}/api/order/carrier-charge-validate`,
        {
          orderStatus: params.orderStatus,
          orderData: {
            idOrder: params.idOrder,
            idCarrier: params.idCarrier,
            paymentMethod: params.paymentMethod,
            carrierInfo: {
              shippingRate0: params.shippingRate0,
              collectionFee: params.collectionFee,
              insuredValueReturn: params.insuredValueReturn,
              profitMargin: params.profitMargin
            }
          },
          agreementType: params.agreementType
        },
        {
          headers: {
            "x-api-key": envs.API_KEY_MS,
            "x-app-name": envs.APP_NAME_MS,
            "Content-Type": "application/json"
          }
        }
      );

      return response.data;
    } catch (error: any) {
      const serializedError = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data
      };
      console.error("Error in Dao.callCarrierChargeValidate:", serializedError);
      throw error;
    }
  };

  updateOrderCarrierInfo = async ({
    idOrder,
    shippingRateBilled
  }: {
    idOrder: number;
    shippingRateBilled: IShippingRateBilled;
  }): Promise<boolean | null> => {
    try {
      return await this.db.update(
        `UPDATE \`order\`
         SET carrierInfo = JSON_SET(
           IFNULL(carrierInfo, '{}'),
           '$.shippingRateBilled',
           CAST(:shippingRateBilled AS JSON)
         )
         WHERE idOrder = :idOrder`,
        {
          replacements: {
            idOrder,
            shippingRateBilled: JSON.stringify(shippingRateBilled)
          }
        }
      );
    } catch (error) {
      console.error("Error in Dao.updateOrderCarrierInfo:", error);
      throw error;
    }
  };
}

export default Dao;
