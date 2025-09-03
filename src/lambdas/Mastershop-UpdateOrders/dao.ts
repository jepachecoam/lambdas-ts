import { QueryTypes } from "sequelize";

import db from "./database/config";
import { IRecordData } from "./types";
import utils from "./utils";

class Dao {
  private environment: string;
  constructor(environment: string) {
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

  getRecordsData = async ({
    trackingNumbers
  }: {
    trackingNumbers: string[];
  }): Promise<IRecordData[]> => {
    try {
      const query = `
      with OrdersReturnLeg as (SELECT o.idUser,
                                        o.idBussiness     AS idBusiness,
                                        orr.idOrderReturn AS idOrder,
                                        'orderReturnLeg'  as source,
                                        orl.carrierTrackingCode
                                FROM orderReturn orr
                                          inner join \`order\` o ON o.idOrder = orr.idOrder
                                          inner join orderReturnLeg orl on orl.idOrderReturn = orr.idOrderReturn
                                WHERE orl.carrierTrackingCode IN (:trackingNumbers)),
            OrdersReturn as (SELECT o.idUser,
                                    o.idBussiness     AS idBusiness,
                                    orr.idOrderReturn AS idOrder,
                                    'orderReturn'     as source,
                                    orr.carrierTrackingCode
                              FROM orderReturn orr
                                      JOIN \`order\` o ON o.idOrder = orr.idOrder
                              WHERE orr.carrierTrackingCode IN (:trackingNumbers)
                                and orr.carrierTrackingCode not in (select orl.carrierTrackingCode from OrdersReturnLeg orl)),
            OrdersLeg as (SELECT o.idUser,
                                  o.idBussiness AS idBusiness,
                                  ol.idOrder,
                                  'orderLeg'    as source,
                                  ol.carrierTrackingCode
                          FROM orderLeg ol
                                    inner join \`order\` o on o.idOrder = ol.idOrder
                          WHERE ol.carrierTrackingCode IN (:trackingNumbers)
                            and ol.carrierTrackingCode not in (select ore.carrierTrackingCode from OrdersReturn ore)
                            and ol.carrierTrackingCode not in (select orl.carrierTrackingCode from OrdersReturnLeg orl)),
            Orders as (SELECT o.idUser, o.idBussiness AS idBusiness, o.idOrder, 'order' as source, o.carrierTrackingCode
                        FROM \`order\` o
                        WHERE o.carrierTrackingCode IN (:trackingNumbers)
                          and o.carrierTrackingCode not in (select ol.carrierTrackingCode from OrdersLeg ol)
                          and o.carrierTrackingCode not in (select ore.carrierTrackingCode from OrdersReturn ore)
                          and o.carrierTrackingCode not in (select orl.carrierTrackingCode from OrdersReturnLeg orl))
        select *
        from OrdersLeg
        union all
        select *
        from Orders
        union all
        select *
        from OrdersReturnLeg
        union all
        select *
        from OrdersReturn
        `;
      const result = await db.query(query, {
        type: QueryTypes.SELECT,
        replacements: { trackingNumbers }
      });

      return result.length > 0 ? (result as IRecordData[]) : [];
    } catch (error) {
      console.error("Error getRecordsData dao =>>>", error);
      throw error;
    }
  };

  getCarrierStatus = async ({ idCarrier }: any) => {
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

  getShipmentUpdates = async ({ idCarrier }: any) => {
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

  getOrderData = async ({ idOrder }: { idOrder: number }) => {
    try {
      const query = "select * from `order` where idOrder = :idOrder;";
      const result = await db.query(query, {
        type: QueryTypes.SELECT,
        replacements: { idOrder }
      });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getOrderDataForPutOrderReturn dao =>>>", error);
      throw error;
    }
  };

  createOrderShipmentUpdateHistoryIfNotExists = async ({
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

  createOrderReturnShipmentUpdateHistoryIfNotExists = async ({
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
      console.error(
        "Error createOrderReturnShipmentUpdateHistory dao =>>>",
        err
      );
      throw err;
    }
  };

  createOrderReturnIfNotExists = async ({
    returnTrackingNumber,
    orderData,
    updatedShippingRate
  }: any) => {
    try {
      const { idOrder, originAddress, shippingAddress, carrierTracking } =
        orderData;

      const sanitizedOriginAddress =
        utils.validateAndSanitizeJSON(originAddress);
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

  updateStatusOrderReturn = async ({ idStatus, idOrderReturn }: any) => {
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

  createOrderReturnStatusLogIfNotExists = async ({
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
}

export default Dao;
