import axios from "axios";

import Database from "../../shared/databases/sequelize";

class Dao {
  private db: Database;
  constructor(environment: string) {
    this.db = new Database(environment);
  }

  async getOrdersToUpdate({ idCarrier }: { idCarrier: number }) {
    const query = `
    WITH OrdersToCheck AS (SELECT o.idOrder, o.carrierTrackingCode
                          FROM \`order\` o
                          WHERE o.carrierTrackingCode != ''
                            AND o.carrierTrackingCode IS NOT NULL
                            AND (o.idStatus IN (3, 4, 5, 6, 7) OR o.idOrder IN (SELECT osl.idOrder
                                                                                FROM db_mastershop_orders.orderStatusLog osl
                                                                                WHERE osl.idStatus IN (8)
                                                                                  AND DATEDIFF(NOW(), osl.createdAt) < 3))
                            AND o.idCarrier = :idCarrier),
        MaxCreatedAt as (select ol.idOrder, max(ol.createdAt) as createdAt
                          from orderLeg ol
                                  inner join OrdersToCheck otc on otc.idOrder = ol.idOrder
                          group by ol.idOrder),
        LastOrdersLeg as (select ol.idOrder, ol.carrierTrackingCode
                          from orderLeg ol
                                    inner join MaxCreatedAt mca
                                              on ol.idOrder = mca.idOrder and ol.createdAt = mca.createdAt)
    select otc.carrierTrackingCode
    from OrdersToCheck otc
    where idOrder not in (select log.idOrder from LastOrdersLeg log)
    union all
    select log.carrierTrackingCode
    from LastOrdersLeg log
        `;
    return this.db.fetchMany(query, { replacements: { idCarrier } });
  }

  async getOrdersReturnToUpdate({ idCarrier }: { idCarrier: number }) {
    const query = `
    With OrdersToCheck as (select ore.idOrderReturn, ore.carrierTrackingCode
                          from orderReturn ore
                          where ore.idOrder in (select o.idOrder from \`order\` o where o.idCarrier = :idCarrier)
                            and ore.idStatus not in (8, 9)),
        MaxCreatedAt as (select orl.idOrderReturn, max(orl.createdAt) as createdAt
                          from orderReturnLeg orl
                                  inner join OrdersToCheck otc on otc.idOrderReturn = orl.idOrderReturn
                          group by orl.idOrderReturn),
        LastOrdersLeg as (select orl.idOrderReturn, orl.carrierTrackingCode
                          from orderReturnLeg orl
                                    inner join MaxCreatedAt mca
                                              on orl.idOrderReturn = mca.idOrderReturn and orl.createdAt = mca.createdAt)
    select otc.carrierTrackingCode
    from OrdersToCheck otc
    where otc.idOrderReturn not in (select log.idOrderReturn from LastOrdersLeg log)
    union all
    select log.carrierTrackingCode
    from LastOrdersLeg log
        `;
    return this.db.fetchMany(query, { replacements: { idCarrier } });
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
