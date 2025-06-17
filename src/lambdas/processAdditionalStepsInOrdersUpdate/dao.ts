import axios from "axios";
import { QueryTypes } from "sequelize";

import db from "./database/config";

class Dao {
  private db = db;

  async getOrder({ idOrder }: { idOrder: number }) {
    try {
      const query = `
            select * from \`order\` where idOrder = ${idOrder}
            `;
      const result = await this.db.query(query, {
        type: QueryTypes.SELECT
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error in Dao getOrder =>>>", error);
      throw error;
    }
  }

  async getOrderReturn({ idOrderReturn }: { idOrderReturn: number }) {
    try {
      const query = `
            select * from orderReturn where idOrderReturn = ${idOrderReturn}
            `;
      const result = await this.db.query(query, {
        type: QueryTypes.SELECT
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error in Dao getOrderReturn =>>>", error);
      throw error;
    }
  }

  async getCarrierStatusUpdateById({
    idCarrierStatusUpdate,
    idCarrier
  }: {
    idCarrierStatusUpdate: number;
    idCarrier: number;
  }) {
    try {
      const query = `
        select csu.idCarrierStatusUpdate,
                csu.idCarrier,
                csu.carrierStatus,
                csu.carrierName,
                csu.idStatus,
                s.name statusName
        from carrierStatusUpdate csu
                inner join status s on csu.idStatus = s.idStatus
        where idCarrier = ${idCarrier}
        and csu.idCarrierStatusUpdate = ${idCarrierStatusUpdate}
            `;
      const result = await this.db.query(query, {
        type: QueryTypes.SELECT
      });

      return result.length > 0 ? result[0] : null;
    } catch (err) {
      console.error("Error in Dao getCarrierStatusUpdateById =>>>", err);
      throw err;
    }
  }

  async getShipmentUpdateInfoById({
    idShipmentUpdate,
    idCarrier
  }: {
    idShipmentUpdate: number;
    idCarrier: number;
  }) {
    try {
      const query = `
        select codeCarrierShipmentUpdate, idShipmentUpdate, carrierName, notifyToCustomer, typeShipmentUpdate, templateWappMsg, name
        from shipmentUpdate
        where idCarrier = ${idCarrier}
          and idShipmentUpdate = ${idShipmentUpdate}
            `;
      const result = await this.db.query(query, {
        type: QueryTypes.SELECT
      });

      return result.length > 0 ? result[0] : null;
    } catch (err) {
      console.error("Error in Dao getShipmentUpdateInfoById =>>>", err);
      throw err;
    }
  }

  async sendEvent({ source, detailType, detail }: any) {
    try {
      const parameter = {
        source,
        detailType,
        detail
      };

      console.log("payloadSend to MASTERSHOP-SHIPMENT-UPDATE =>>>", parameter);

      const response = await axios.post(
        `${process.env["URL_API_SEND_EVENT"]}/api/b2b/logistics/processevents`,
        parameter,
        {
          headers: {
            "x-api-key": `${process.env["API_KEY_MS"]}`,
            "x-app-name": `${process.env["APP_NAME_MS"]}`
          }
        }
      );
      return response.data;
    } catch (err) {
      console.error("Error in sendEventData dao =>>>", err);
      throw err;
    }
  }
}

export default Dao;
