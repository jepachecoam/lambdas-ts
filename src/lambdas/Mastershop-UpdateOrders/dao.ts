import { QueryTypes } from "sequelize";

import db from "./database/config";
import utils from "./utils";

const putOrder = async ({ orderData }: { orderData: any }) => {
  return utils.httpRequest({
    method: "put",
    url: `${process.env["BASE_URL_MS"]}/${process.env["ENVIRONMENT"]}/api/b2b/logistics/order`,
    data: orderData,
    config: {
      headers: {
        "x-app-name": `${process.env["APP_NAME_MS"]}`,
        "x-api-key": `${process.env["API_KEY_MS"]}`
      }
    }
  });
};

const getOrder = async ({
  idUser,
  idOrder,
  idBusiness
}: {
  idUser: number;
  idOrder: number;
  idBusiness: number;
}) => {
  const parameter = {
    orderId: idOrder,
    idBussiness: idBusiness
  };

  return utils.httpRequest({
    method: "post",
    url: `${process.env["BASE_URL_MS"]}/${process.env["ENVIRONMENT"]}/api/b2b/logistics/order/${idUser}`,
    data: parameter,
    config: {
      headers: {
        "x-app-name": `${process.env["APP_NAME_MS"]}`,
        "x-api-key": `${process.env["API_KEY_MS"]}`
      }
    }
  });
};

const sendEvent = async ({ source, detailType, detail }: any) => {
  const parameter = {
    source,
    detailType,
    detail
  };

  return utils.httpRequest({
    method: "post",
    url: `${process.env["BASE_URL_MS"]}/${process.env["ENVIRONMENT"]}/api/b2b/logistics/processevents`,
    data: parameter,
    config: {
      headers: {
        "x-api-key": `${process.env["API_KEY_MS"]}`,
        "x-app-name": `${process.env["APP_NAME_MS"]}`
      }
    }
  });
};

const sendErrorNotification = async (data: any) => {
  return utils.httpRequest({
    method: "post",
    url: process.env["URL_WEBHOOK_ERROR_LOGS"],
    data: { ...data },
    config: {
      headers: {
        "Content-Type": "application/json"
      }
    }
  });
};

const getDataInReturnTableByTrackingNumbers = async ({
  trackingNumbers
}: any) => {
  try {
    const query = `
            SELECT o.idUser, o.idBussiness AS idBusiness, orr.idOrderReturn AS idOrder,  'orderReturn' as source, orr.carrierTrackingCode
            FROM \`order\` o
                     JOIN orderReturn orr ON o.idOrder = orr.idOrder
            WHERE orr.carrierTrackingCode IN (${trackingNumbers.join(",")})
        `;
    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result : [];
  } catch (error) {
    console.error(
      "Error getDataInReturnTableByTrackingNumbers dao =>>>",
      error
    );
    throw error;
  }
};

const getDataInOrderTableByTrackingNumbers = async ({
  trackingNumbers
}: any) => {
  try {
    const query = `
            SELECT o.idUser, o.idBussiness AS idBusiness, o.idOrder,  'order' as source, carrierTrackingCode
            FROM \`order\` o
            WHERE o.carrierTrackingCode IN (${trackingNumbers.join(",")})
        `;

    const result = await db.query(query, {
      type: QueryTypes.SELECT
    });

    return result.length > 0 ? result : [];
  } catch (error) {
    console.error("Error getDataInOrderTableByTrackingNumbers dao =>>>", error);
    throw error;
  }
};

const getCarrierStatus = async ({ idCarrier }: any) => {
  try {
    const query = `SELECT carrierCode, idCarrierStatusUpdate, isActive, statusAuxLabel, s.idStatus, s.name as statusName, requiresAdditionalSteps
                    FROM carrierStatusUpdate  csu inner join status s  on csu.idStatus = s.idStatus
                    WHERE idCarrier = :idCarrier`;
    const result = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: { idCarrier }
    });

    return result.length > 0 ? result : [];
  } catch (error) {
    console.error("Error getCarrierStatus dao =>>>", error);
    throw error;
  }
};

const getShipmentUpdates = async ({ idCarrier }: any) => {
  try {
    const query = `SELECT codeCarrierShipmentUpdate, isActive, idShipmentUpdate, name, requiresAdditionalSteps
                       FROM shipmentUpdate
                       WHERE idCarrier = :idCarrier`;
    const result = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: { idCarrier }
    });

    return result.length > 0 ? result : [];
  } catch (error) {
    console.error("Error getShipmentUpdates dao =>>>", error);
    throw error;
  }
};

const getOrderDataForPutOrderReturn = async ({ carrierTrackingCode }: any) => {
  try {
    const query =
      "select * from `order` where carrierTrackingCode = :carrierTrackingCode;";
    const result = await db.query(query, {
      type: QueryTypes.SELECT,
      replacements: { carrierTrackingCode }
    });
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error getOrderDataForPutOrderReturn dao =>>>", error);
    throw error;
  }
};

const createOrderShipmentUpdateHistoryIfNotExists = async ({
  idOrder,
  idCarrierStatusUpdate,
  sanitizedCarrierData,
  idShipmentUpdate,
  updateSource
}: any) => {
  try {
    const query = `
                INSERT INTO orderShipmentUpdateHistory
                (idOrder, idCarrierStatusUpdate, carrierData, createdAt, updatedAt, idShipmentUpdate, status, updateSource)
                SELECT :idOrder,
                       :idCarrierStatusUpdate,
                       :sanitizedCarrierData,
                       NOW(),
                       NOW(),
                       :idShipmentUpdate,
                       :status,
                       :updateSource
                WHERE NOT EXISTS (SELECT 1
                                  FROM orderShipmentUpdateHistory oh
                                  WHERE oh.idOrder = :idOrder
                                    AND oh.createdAt = (SELECT MAX(createdAt)
                                                        FROM orderShipmentUpdateHistory
                                                        WHERE idOrder = :idOrder)
                                    AND (oh.idShipmentUpdate IS NOT NULL AND oh.idShipmentUpdate = :idShipmentUpdate OR
                                         oh.idCarrierStatusUpdate = :idCarrierStatusUpdate AND oh.idShipmentUpdate IS NULL));
        `;

    const result = await db.query(query, {
      type: QueryTypes.INSERT,
      replacements: {
        idOrder,
        idCarrierStatusUpdate,
        sanitizedCarrierData,
        idShipmentUpdate,
        status: idShipmentUpdate ? "PENDING" : null,
        updateSource: updateSource || null
      }
    });

    return result[1] > 0;
  } catch (err) {
    console.error("Error createOrderShipmentUpdateHistory dao =>>>", err);
    throw err;
  }
};

const createOrderReturnShipmentUpdateHistoryIfNotExists = async ({
  idCarrierStatusUpdate,
  sanitizedCarrierData,
  idOrder,
  idShipmentUpdate,
  updateSource
}: any) => {
  try {
    const query = `
            INSERT INTO orderReturnShipmentUpdateHistory
            (idOrderReturn, idCarrierStatusUpdate, carrierData, createdAt, updatedAt, idShipmentUpdate, status, updateSource)
            SELECT
                :idOrderReturn,
                :idCarrierStatusUpdate,
                :sanitizedCarrierData,
                NOW(),
                NOW(),
                :idShipmentUpdate,
                :status,
                :updateSource
                WHERE NOT EXISTS (
                SELECT 1 
                FROM orderReturnShipmentUpdateHistory
                WHERE idOrderReturn = :idOrderReturn
                  AND createdAt = (
                      SELECT MAX(createdAt)
                      FROM orderReturnShipmentUpdateHistory
                      WHERE idOrderReturn = :idOrderReturn
                  )
                  AND (
                      (idShipmentUpdate IS NOT NULL AND idShipmentUpdate = :idShipmentUpdate)
                      OR 
                      (idCarrierStatusUpdate = :idCarrierStatusUpdate AND idShipmentUpdate IS NULL)
                  )
            );
        `;

    const result = await db.query(query, {
      type: QueryTypes.INSERT,
      replacements: {
        idOrderReturn: idOrder,
        idCarrierStatusUpdate,
        sanitizedCarrierData,
        idShipmentUpdate,
        status: idShipmentUpdate ? "PENDING" : null,
        updateSource: updateSource || null
      }
    });

    return result[1] > 0;
  } catch (err) {
    console.error("Error createOrderReturnShipmentUpdateHistory dao =>>>", err);
    throw err;
  }
};

const createOrderReturnIfNotExists = async ({
  returnTrackingNumber,
  orderData,
  updatedShippingRate
}: any) => {
  try {
    const { idOrder, originAddress, shippingAddress, carrierTracking } =
      orderData;

    const sanitizedOriginAddress = utils.validateAndSanitizeJSON(originAddress);
    const sanitizedShippingAddress =
      utils.validateAndSanitizeJSON(shippingAddress);
    const sanitizedCarrierTracking =
      utils.validateAndSanitizeJSON(carrierTracking);

    const query = `
                INSERT INTO orderReturn (idOrder, idStatus, orderReturnDate, originAddress, shippingAddress, shippingRate,
                                         carrierTrackingCode, carrierTracking, createdAt, updatedAt)
                SELECT :idOrder,
                       10,
                       NOW(),
                       :sanitizedShippingAddress,
                       :sanitizedOriginAddress,
                       :shippingRate,
                       :returnTrackingNumber,
                       :sanitizedCarrierTracking,
                       NOW(),
                       NOW()
                WHERE NOT EXISTS (SELECT 1
                                  FROM orderReturn
                                  WHERE idOrder = :idOrder
                                    AND carrierTrackingCode = :returnTrackingNumber)
        `;

    const result = await db.query(query, {
      type: QueryTypes.INSERT,
      replacements: {
        idOrder,
        sanitizedShippingAddress,
        sanitizedOriginAddress,
        shippingRate: updatedShippingRate,
        returnTrackingNumber,
        sanitizedCarrierTracking
      }
    });
    return result[1] > 0;
  } catch (error) {
    console.error("Error createOrderReturn dao =>>>", error);
    throw error;
  }
};

const updateStatusOrderReturn = async ({ idStatus, idOrderReturn }: any) => {
  try {
    const query = `
            UPDATE orderReturn
            SET idStatus = :idStatus, updatedAt = now()
            WHERE idOrderReturn = :idOrderReturn;
        `;
    return await db.query(query, {
      type: QueryTypes.UPDATE,
      replacements: { idStatus, idOrderReturn }
    });
  } catch (err) {
    console.error("Error updateStatusOrderReturn dao =>>>", err);
    throw err;
  }
};

const createOrderReturnStatusLogIfNotExists = async ({
  idOrderReturn,
  idStatus
}: any) => {
  try {
    const query = `
            INSERT INTO orderReturnStatusLog (idOrderReturn, idStatus, createdAt, updatedAt)
            SELECT :idOrderReturn, :idStatus, NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 
                FROM orderReturnStatusLog 
                WHERE idOrderReturn = :idOrderReturn
                  AND createdAt = (
                      SELECT MAX(createdAt)
                      FROM orderReturnStatusLog
                      WHERE idOrderReturn = :idOrderReturn
                  )
                  AND idStatus = :idStatus
            );
        `;

    const result = await db.query(query, {
      type: QueryTypes.INSERT,
      replacements: { idOrderReturn, idStatus }
    });

    return result[1] > 0;
  } catch (err) {
    console.error("Error createOrderReturnStatusLog dao =>>>", err);
    throw err;
  }
};

export default {
  sendEvent,
  getOrder,
  putOrder,
  sendErrorNotification,
  getOrderDataForPutOrderReturn,
  createOrderReturnIfNotExists,
  createOrderShipmentUpdateHistoryIfNotExists,
  createOrderReturnShipmentUpdateHistoryIfNotExists,
  createOrderReturnStatusLogIfNotExists,
  updateStatusOrderReturn,
  getCarrierStatus,
  getShipmentUpdates,
  getDataInReturnTableByTrackingNumbers,
  getDataInOrderTableByTrackingNumbers
};
