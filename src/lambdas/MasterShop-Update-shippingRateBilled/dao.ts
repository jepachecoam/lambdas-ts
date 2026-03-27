import axios from "axios";

import Database from "../../shared/databases/db-sm/sequelize-sm";
import { envs } from "./conf/envs";
import {
  ICarrierChargeResponse,
  IOrderData,
  IProcessInput,
  IShippingRateBilled
} from "./types";

class Dao {
  private db: Database;
  private environment: string;

  constructor(db: Database, environment: string) {
    this.db = db;
    this.environment = environment;
  }

  getOrderData = async (idOrder: number): Promise<IOrderData> => {
    try {
      const result = await this.db.fetchOne(
        `SELECT idCarrier, paymentMethod, shippingRateQuoted, carrierInfo
         FROM \`order\`
         WHERE idOrder = :idOrder`,
        { replacements: { idOrder } }
      );

      if (!result) {
        throw new Error(`Order not found for idOrder: ${idOrder}`);
      }

      return result as IOrderData;
    } catch (error) {
      console.error("Error in Dao.getOrderData:", error);
      throw error;
    }
  };

  callCarrierChargeValidate = async (
    params: IProcessInput
  ): Promise<ICarrierChargeResponse> => {
    try {
      const response = await axios.post<ICarrierChargeResponse>(
        `${envs.BASE_URL_MS}/${this.environment}/api/b2b/orderLogistics/order/carrier-charge-validate`,
        params,
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
      console.error("Error in Dao.callCarrierChargeValidate:", error);
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
          },
          logging: console.log
        }
      );
    } catch (error) {
      console.error("Error in Dao.updateOrderCarrierInfo:", error);
      throw error;
    }
  };
}

export default Dao;
