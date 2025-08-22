import axios from "axios";

import Database from "../../shared/databases/sequelize";

class Dao {
  private db: Database;
  constructor(environment: string) {
    this.db = new Database(environment);
  }

  async getOrdersToUpdate({ idCarrier }: { idCarrier: number }) {
    const query = `
        SELECT carrierTrackingCode
        FROM db_mastershop_orders.order
        WHERE carrierTrackingCode != '' AND carrierTrackingCode IS NOT NULL AND 
                (idStatus IN (3, 4, 5, 6, 7) OR idOrder IN (
                SELECT idOrder
                FROM db_mastershop_orders.orderStatusLog
                WHERE idStatus IN (8) AND DATEDIFF(NOW(), createdAt) < 3
                )) AND idCarrier = ${idCarrier};
        `;
    return this.db.fetchMany(query);
  }

  async getOrdersReturnToUpdate({ idCarrier }: { idCarrier: number }) {
    const query = `
        select carrierTrackingCode
        from orderReturn
        where idOrder in (select idOrder from \`order\` where idCarrier = ${idCarrier})
          and idStatus not in (8, 9)
        `;
    return this.db.fetchMany(query);
  }

  async fetchGuideEndpoint({
    carrierTrackingCode,
    carrier
  }: {
    carrierTrackingCode: number;
    carrier: number;
  }) {
    const url = `${process.env["BASE_URL"]}/prod/b2b/api/${carrier}/statusGuide/${carrierTrackingCode}`;

    try {
      const response = await axios.get(url, {
        headers: {
          "x-api-key": `${process.env["API_KEY_MS"]}`,
          "x-app-name": `${process.env["APP_NAME_MS"]}`
        }
      });

      console.log(
        `Guide fetch successful: Carrier=${carrier}, TrackingCode=${carrierTrackingCode}`
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

      console.error(
        `Error fetching guide: Carrier=${carrier}, TrackingCode=${carrierTrackingCode} =>>`,
        serializedError
      );

      throw error;
    }
  }

  async sendCarrierDataToUpdateOrder({ carrierData }: any) {
    try {
      const result = await axios.post(
        `${process.env["URL_API_UPDATE_ORDER"]}/b2b/api/UpdateOrder`,
        carrierData,
        {
          headers: {
            "x-api-key": `${process.env["API_KEY_MS"]}`,
            "x-app-name": `${process.env["APP_NAME_MS"]}`
          }
        }
      );
      console.log("carrierData sended =>>>", carrierData);
      return result;
    } catch (error) {
      console.error("Error in sendCarrierDataToUpdateOrder dao =>>>", error);
      throw error;
    }
  }
}
export default Dao;
