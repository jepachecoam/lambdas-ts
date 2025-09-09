import Database from "../../shared/databases/sequelize";
import { b2bClientMs } from "./utils/b2bRequest";

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
        detail: { ...detail, contextStage: this.environment }
      };

      console.log("payloadSend to MASTERSHOP-SHIPMENT-UPDATE =>>>", parameter);

      const response = await b2bClientMs.post(
        `/${this.environment}/api/b2b/logistics/processevents`,
        parameter
      );
      return response.data;
    } catch (err) {
      console.error("Error in sendEventData dao =>>>", err);
      throw err;
    }
  };

  fetchMainOrder = async ({ idUser, idOrder, idBusiness }: any) => {
    try {
      const parameter = {
        orderId: idOrder,
        idBussiness: idBusiness
      };
      const objectResp = await b2bClientMs.post(
        `/${this.environment}/api/b2b/logistics/order/${idUser}`,
        parameter
      );
      return objectResp.data.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}

export default Dao;
