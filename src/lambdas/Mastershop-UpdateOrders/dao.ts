import { QueryTypes } from "sequelize";

import Database from "../../shared/databases/sequelize";
import db from "./database/config";
import { IRecordData } from "./types";
import utils from "./utils";

class Dao {
  private db: Database;
  private environment: string;
  constructor(environment: string) {
    this.db = new Database(environment);
    this.environment = environment;
  }

  putOrder = async ({ orderData }: { orderData: any }) => {
    return utils.httpRequest({
      method: "put",
      url: `${process.env["BASE_URL_MS"]}/${this.environment}/api/b2b/logistics/order`,
      data: orderData,
      config: {
        headers: {
          "x-app-name": `${process.env["APP_NAME_MS"]}`,
          "x-api-key": `${process.env["API_KEY_MS"]}`
        }
      }
    });
  };

  getOrder = async ({
    idUser,
    idOrder
  }: {
    idUser: number;
    idOrder: number;
  }) => {
    const parameter = {
      orderId: idOrder
    };

    return utils.httpRequest({
      method: "post",
      url: `${process.env["BASE_URL_MS"]}/${this.environment}/api/b2b/logistics/order/${idUser}`,
      data: parameter,
      config: {
        headers: {
          "x-app-name": `${process.env["APP_NAME_MS"]}`,
          "x-api-key": `${process.env["API_KEY_MS"]}`
        }
      }
    });
  };

  sendEvent = async ({ source, detailType, detail }: any) => {
    const parameter = {
      source,
      detailType,
      detail
    };

    return utils.httpRequest({
      method: "post",
      url: `${process.env["BASE_URL_MS"]}/${this.environment}/api/b2b/logistics/processevents`,
      data: parameter,
      config: {
        headers: {
          "x-api-key": `${process.env["API_KEY_MS"]}`,
          "x-app-name": `${process.env["APP_NAME_MS"]}`
        }
      }
    });
  };

  sendErrorNotification = async (data: any) => {
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

  getDataByCarrierTrackingNumber = async ({
    trackingNumbers
  }: {
    trackingNumbers: string[];
  }): Promise<IRecordData[] | null> => {
    const query = `
      WITH OrdersReturnLeg AS (SELECT o.idUser,
                                      o.idBussiness    AS idBusiness,
                                      orr.idOrder,
                                      orr.idOrderReturn,
                                      'orderReturnLeg' AS source,
                                      orl.carrierTrackingCode
                              FROM orderReturn orr
                                        INNER JOIN \`order\` o
                                                  ON o.idOrder = orr.idOrder
                                        INNER JOIN orderReturnLeg orl
                                                  ON orl.idOrderReturn = orr.idOrderReturn
                              WHERE orl.carrierTrackingCode IN (:trackingNumbers)),
          OrdersReturn AS (SELECT o.idUser,
                                  o.idBussiness AS idBusiness,
                                  orr.idOrder,
                                  orr.idOrderReturn,
                                  'orderReturn' AS source,
                                  orr.carrierTrackingCode
                            FROM orderReturn orr
                                    JOIN \`order\` o
                                          ON o.idOrder = orr.idOrder
                            WHERE orr.carrierTrackingCode IN (:trackingNumbers)
                              AND NOT EXISTS (SELECT 1
                                              FROM OrdersReturnLeg orl
                                              WHERE orl.carrierTrackingCode = orr.carrierTrackingCode)),
          OrdersLeg AS (SELECT o.idUser,
                                o.idBussiness AS idBusiness,
                                ol.idOrder,
                                NULL          AS idOrderReturn,
                                'orderLeg'    AS source,
                                ol.carrierTrackingCode
                        FROM orderLeg ol
                                  INNER JOIN \`order\` o
                                            ON o.idOrder = ol.idOrder
                        WHERE ol.carrierTrackingCode IN (:trackingNumbers)
                          AND NOT EXISTS (SELECT 1
                                          FROM OrdersReturn ore
                                          WHERE ore.carrierTrackingCode = ol.carrierTrackingCode)
                          AND NOT EXISTS (SELECT 1
                                          FROM OrdersReturnLeg orl
                                          WHERE orl.carrierTrackingCode = ol.carrierTrackingCode)),
          Orders AS (SELECT o.idUser,
                            o.idBussiness AS idBusiness,
                            o.idOrder,
                            NULL          AS idOrderReturn,
                            'order'       AS source,
                            o.carrierTrackingCode
                      FROM \`order\` o
                      WHERE o.carrierTrackingCode IN (:trackingNumbers)
                        AND NOT EXISTS (SELECT 1
                                        FROM OrdersLeg ol
                                        WHERE ol.carrierTrackingCode = o.carrierTrackingCode)
                        AND NOT EXISTS (SELECT 1
                                        FROM OrdersReturn ore
                                        WHERE ore.carrierTrackingCode = o.carrierTrackingCode)
                        AND NOT EXISTS (SELECT 1
                                        FROM OrdersReturnLeg orl
                                        WHERE orl.carrierTrackingCode = o.carrierTrackingCode))
      SELECT *
      FROM OrdersLeg
      UNION ALL
      SELECT *
      FROM Orders
      UNION ALL
      SELECT *
      FROM OrdersReturnLeg
      UNION ALL
      SELECT *
      FROM OrdersReturn;
        `;

    return this.db.fetchMany(query, {
      replacements: { trackingNumbers }
    });
  };

  getOrderPrecedence = async ({ idOrders }: { idOrders: number[] }) => {
    const query = `
      WITH OrdersReturnLeg AS (SELECT ore.idOrder,
                                      'orderReturnLeg' AS source
                              FROM orderReturnLeg orl
                                        INNER JOIN orderReturn ore
                                                  ON orl.idOrderReturn = ore.idOrderReturn
                              WHERE ore.idOrder IN (:idOrders)),
          OrdersReturn AS (SELECT ore.idOrder,
                                  'orderReturn' AS source
                            FROM orderReturn ore
                            WHERE ore.idOrder IN (:idOrders)
                              AND NOT EXISTS (SELECT 1
                                              FROM OrdersReturnLeg orl
                                              WHERE orl.idOrder = ore.idOrder)),
          OrdersLeg AS (SELECT ol.idOrder,
                                'orderLeg' AS source
                        FROM orderLeg ol
                        WHERE ol.idOrder IN (:idOrders)
                          AND NOT EXISTS (SELECT 1
                                          FROM OrdersReturn ore
                                          WHERE ore.idOrder = ol.idOrder)
                          AND NOT EXISTS (SELECT 1
                                          FROM OrdersReturnLeg orl
                                          WHERE orl.idOrder = ol.idOrder)),
          Orders AS (SELECT o.idOrder,
                            'order' AS source
                      FROM \`order\` o
                      WHERE o.idOrder IN (:idOrders)
                        AND NOT EXISTS (SELECT 1
                                        FROM OrdersLeg ol
                                        WHERE ol.idOrder = o.idOrder)
                        AND NOT EXISTS (SELECT 1
                                        FROM OrdersReturn ore
                                        WHERE ore.idOrder = o.idOrder)
                        AND NOT EXISTS (SELECT 1
                                        FROM OrdersReturnLeg orl
                                        WHERE orl.idOrder = o.idOrder))
      SELECT *
      FROM OrdersLeg
      UNION ALL
      SELECT *
      FROM Orders
      UNION ALL
      SELECT *
      FROM OrdersReturnLeg
      UNION ALL
      SELECT *
      FROM OrdersReturn;`;

    return this.db.fetchMany(query, {
      replacements: { idOrders }
    });
  };

  getCarrierStatus = async ({ idCarrier }: any) => {
    const query = `SELECT carrierCode, idCarrierStatusUpdate, isActive, statusAuxLabel, s.idStatus, s.name as statusName, requiresAdditionalSteps
                    FROM carrierStatusUpdate  csu inner join status s  on csu.idStatus = s.idStatus
                    WHERE idCarrier = :idCarrier`;
    return this.db.fetchMany(query, {
      replacements: { idCarrier }
    });
  };

  getShipmentUpdates = async ({ idCarrier }: any) => {
    const query = `SELECT codeCarrierShipmentUpdate, isActive, idShipmentUpdate, name, requiresAdditionalSteps
                       FROM shipmentUpdate
                       WHERE idCarrier = :idCarrier`;
    return this.db.fetchMany(query, {
      replacements: { idCarrier }
    });
  };

  getOrderData = async ({ idOrder }: { idOrder: number }) => {
    const query = "select * from `order` where idOrder = :idOrder;";
    return this.db.fetchOne(query, {
      replacements: { idOrder }
    });
  };

  getLatestOrderLeg = async ({ idOrder }: { idOrder: number }) => {
    const query = `select ol.idOrderLeg, ol.carrierTrackingCode, ol.createdAt
                     from orderLeg ol
                     where ol.idOrder = :idOrder
                     order by ol.createdAt desc, ol.idOrderLeg desc
                     limit 1;`;
    return this.db.fetchOne(query, {
      replacements: { idOrder }
    });
  };

  getLatestOrderReturnLeg = async ({
    idOrderReturn
  }: {
    idOrderReturn: number;
  }) => {
    const query = `select orl.idOrderReturnLeg, orl.carrierTrackingCode, orl.createdAt
                     from orderReturnLeg orl
                     where orl.idOrderReturn = :idOrderReturn
                     order by orl.createdAt desc, orl.idOrderReturnLeg desc
                     limit 1;`;
    return this.db.fetchOne(query, {
      replacements: { idOrderReturn }
    });
  };

  createOrderShipmentUpdateHistoryIfNotExists = async ({
    idOrder,
    status,
    idCarrierStatusUpdate,
    carrierData,
    idShipmentUpdate,
    updateSource,
    idOrderLeg
  }: any) => {
    const query = `
                INSERT INTO orderShipmentUpdateHistory
                (idOrder, idCarrierStatusUpdate, carrierData, createdAt, updatedAt, idShipmentUpdate, status, updateSource, idOrderLeg)
                SELECT :idOrder,
                       :idCarrierStatusUpdate,
                       :carrierData,
                       NOW(),
                       NOW(),
                       :idShipmentUpdate,
                       :status,
                       :updateSource,
                       :idOrderLeg
                WHERE NOT EXISTS (SELECT 1
                                  FROM orderShipmentUpdateHistory oh
                                  WHERE oh.idOrder = :idOrder
                                    AND oh.createdAt = (SELECT MAX(createdAt)
                                                        FROM orderShipmentUpdateHistory
                                                        WHERE idOrder = :idOrder)
                                    AND (oh.idShipmentUpdate IS NOT NULL AND oh.idShipmentUpdate = :idShipmentUpdate OR
                                         oh.idCarrierStatusUpdate = :idCarrierStatusUpdate AND oh.idShipmentUpdate IS NULL));
        `;

    return this.db.insert(query, {
      replacements: {
        idOrder,
        idCarrierStatusUpdate,
        carrierData,
        idShipmentUpdate,
        status,
        updateSource,
        idOrderLeg
      }
    });
  };

  createOrderReturnShipmentUpdateHistoryIfNotExists = async ({
    idCarrierStatusUpdate,
    carrierData,
    idOrderReturn,
    idShipmentUpdate,
    updateSource,
    status,
    idOrderReturnLeg
  }: any) => {
    const query = `
            INSERT INTO orderReturnShipmentUpdateHistory
            (idOrderReturn, idCarrierStatusUpdate, carrierData, createdAt, updatedAt, idShipmentUpdate, status, updateSource, idOrderReturnLeg)
            SELECT
                :idOrderReturn,
                :idCarrierStatusUpdate,
                :carrierData,
                NOW(),
                NOW(),
                :idShipmentUpdate,
                :status,
                :updateSource,
                :idOrderReturnLeg
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

    return this.db.insert(query, {
      replacements: {
        idOrderReturn,
        idCarrierStatusUpdate,
        carrierData,
        idShipmentUpdate,
        status,
        updateSource,
        idOrderReturnLeg
      }
    });
  };

  createOrderReturnIfNotExists = async ({
    idOrder,
    shippingAddress,
    originAddress,
    shippingRate,
    returnTrackingNumber,
    carrierTracking
  }: any) => {
    const query = `
                INSERT INTO orderReturn (idOrder, idStatus, orderReturnDate, originAddress, shippingAddress, shippingRate,
                                         carrierTrackingCode, carrierTracking, createdAt, updatedAt)
                SELECT :idOrder,
                       10,
                       NOW(),
                       :shippingAddress,
                       :originAddress,
                       :shippingRate,
                       :returnTrackingNumber,
                       :carrierTracking,
                       NOW(),
                       NOW()
                WHERE NOT EXISTS (SELECT 1
                                  FROM orderReturn
                                  WHERE idOrder = :idOrder
                                    AND carrierTrackingCode = :returnTrackingNumber)
        `;

    return this.db.insert(query, {
      replacements: {
        idOrder,
        shippingAddress,
        originAddress,
        shippingRate,
        returnTrackingNumber,
        carrierTracking
      }
    });
  };

  updateStatusOrderReturn = async ({ idStatus, idOrderReturn }: any) => {
    const query = `
            UPDATE orderReturn
            SET idStatus = :idStatus, updatedAt = now()
            WHERE idOrderReturn = :idOrderReturn;
        `;
    return this.db.update(query, {
      replacements: { idStatus, idOrderReturn }
    });
  };

  createOrderReturnStatusLogIfNotExists = async ({
    idOrderReturn,
    idStatus
  }: any) => {
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

    return this.db.insert(query, {
      replacements: { idOrderReturn, idStatus }
    });
  };

  createOrderLeg = async ({
    idOrder,
    carrierTrackingCode,
    legReason,
    source,
    originAddress,
    shippingAddress,
    notes,
    shippingRate,
    idAlert,
    parentLegId
  }: any) => {
    const query = `
        INSERT INTO orderLeg 
        (idOrder, carrierTrackingCode, legReason, source, originAddress, shippingAddress, notes, shippingRate, idAlert, parentLegId, createdAt, updatedAt)
        SELECT :idOrder, :carrierTrackingCode, :legReason, :source, :originAddress, :shippingAddress, :notes, :shippingRate, :idAlert, :parentLegId, NOW(), NOW()
        WHERE NOT EXISTS (
          SELECT 1 
          FROM orderLeg 
          WHERE idOrder = :idOrder 
            AND carrierTrackingCode = :carrierTrackingCode
        )
      `;

    return this.db.insert(query, {
      replacements: {
        idOrder,
        carrierTrackingCode,
        legReason,
        source,
        originAddress,
        shippingAddress,
        notes,
        shippingRate,
        idAlert,
        parentLegId
      }
    });
  };

  createOrderReturnLeg = async ({
    idOrderReturn,
    carrierTrackingCode,
    legReason,
    source,
    originAddress,
    shippingAddress,
    notes,
    shippingRate,
    idAlert,
    parentLegId
  }: any) => {
    const query = `
        INSERT INTO orderReturnLeg 
        (idOrderReturn, carrierTrackingCode, legReason, source, originAddress, shippingAddress, notes, shippingRate, idAlert, parentLegId, createdAt, updatedAt)
        SELECT :idOrderReturn, :carrierTrackingCode, :legReason, :source, :originAddress, :shippingAddress, :notes, :shippingRate, :idAlert, :parentLegId, NOW(), NOW()
        WHERE NOT EXISTS (
          SELECT 1 
          FROM orderReturnLeg 
          WHERE idOrderReturn = :idOrderReturn 
            AND carrierTrackingCode = :carrierTrackingCode
        )
      `;

    return this.db.insert(query, {
      replacements: {
        idOrderReturn,
        carrierTrackingCode,
        legReason,
        source,
        originAddress,
        shippingAddress,
        notes,
        shippingRate,
        idAlert,
        parentLegId
      }
    });
  };
}

export default Dao;
