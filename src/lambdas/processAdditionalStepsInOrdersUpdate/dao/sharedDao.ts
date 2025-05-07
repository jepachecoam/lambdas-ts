import axios from "axios";
import { QueryTypes } from "sequelize";

import db from "../database/config";

const createCarrierTrackingCodeHistory = async ({
  idOrder,
  newCarrierTrackingCode,
  source
}: any) => {
  try {
    const query = `
            INSERT INTO carrierTrackingCodeHistory (idOrder, carrierTrackingCode, source)
            SELECT ${idOrder}, '${newCarrierTrackingCode} ', '${source}'
            WHERE NOT EXISTS (
                SELECT 1 
                FROM carrierTrackingCodeHistory
                WHERE idOrder = ${idOrder}
                  AND carrierTrackingCode = '${newCarrierTrackingCode}'
            )
        `;

    const result = await db.query(query, {
      type: QueryTypes.INSERT
    });

    return result.length > 0;
  } catch (error) {
    console.error("Error in Dao createCarrierTrackingCodeHistory =>>>", error);
    throw error;
  }
};

const getOrder = async ({ idOrder }: any) => {
  try {
    const query = `
            select * from \`order\` where idOrder = ${idOrder}
            `;
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error in Dao createCarrierTrackingCodeHistory =>>>", error);
    throw error;
  }
};

const getOrderReturn = async ({ idOrderReturn }: any) => {
  try {
    const query = `
            select * from orderReturn where idOrderReturn = ${idOrderReturn}
            `;
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error in Dao createCarrierTrackingCodeHistory =>>>", error);
    throw error;
  }
};

const getCarrierStatusUpdateById = async ({
  idCarrierStatusUpdate,
  idCarrier
}: any) => {
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
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error("Error in Dao getCarrierStatusUpdateById =>>>", err);
    throw err;
  }
};

const getShipmentUpdateInfoById = async ({
  idShipmentUpdate,
  idCarrier
}: any) => {
  try {
    const query = `
        select codeCarrierShipmentUpdate, idShipmentUpdate, carrierName, notifyToCustomer, typeShipmentUpdate, templateWappMsg, name
        from shipmentUpdate
        where idCarrier = ${idCarrier}
          and idShipmentUpdate = ${idShipmentUpdate}
            `;
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error("Error in Dao getShipmentUpdateInfoById =>>>", err);
    throw err;
  }
};

const sendEvent = async ({ source, detailType, detail }: any) => {
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
};

export default {
  getOrder,
  getOrderReturn,
  createCarrierTrackingCodeHistory,
  getCarrierStatusUpdateById,
  getShipmentUpdateInfoById,
  sendEvent
};
