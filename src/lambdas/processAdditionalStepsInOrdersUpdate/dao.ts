import axios from "axios";

import Database from "../../shared/databases/sequelize";
import { envs } from "./conf/envs";

class Dao {
  private db: Database;
  private environment: string;
  constructor(environment: string) {
    this.environment = environment;
    this.db = new Database(environment);
  }

  getOrder = async ({ idOrder }: any) => {
    const query = `
              select * from \`order\` where idOrder = ${idOrder}
              `;

    return this.db.fetchOne(query);
  };

  getOrderReturn = async ({ idOrderReturn }: any) => {
    const query = `
              select * from orderReturn where idOrderReturn = ${idOrderReturn}
              `;

    return this.db.fetchOne(query);
  };

  getCarrierStatusUpdateById = async ({
    idCarrierStatusUpdate,
    idCarrier
  }: any) => {
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

    return this.db.fetchOne(query);
  };

  getShipmentUpdateInfoById = async ({ idShipmentUpdate, idCarrier }: any) => {
    const query = `
          select codeCarrierShipmentUpdate, idShipmentUpdate, carrierName, notifyToCustomer, typeShipmentUpdate, templateWappMsg, name
          from shipmentUpdate
          where idCarrier = ${idCarrier}
            and idShipmentUpdate = ${idShipmentUpdate}
              `;
    return this.db.fetchOne(query);
  };

  sendEvent = async ({ source, detailType, detail }: any) => {
    try {
      const parameter = {
        source,
        detailType,
        detail
      };

      console.log("payloadSend to MASTERSHOP-SHIPMENT-UPDATE =>>>", parameter);

      const response = await axios.post(
        `${envs.URL_API_SEND_EVENT}/${this.environment}/api/b2b/logistics/processevents`,
        parameter,
        {
          headers: {
            "x-api-key": envs.API_KEY_MS,
            "x-app-name": envs.APP_NAME_MS
          }
        }
      );
      return response.data;
    } catch (err) {
      console.error("Error in sendEventData dao =>>>", err);
      throw err;
    }
  };
}

export default Dao;
