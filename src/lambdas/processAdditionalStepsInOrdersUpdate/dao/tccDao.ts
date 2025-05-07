import { QueryTypes } from "sequelize";

import db from "../database/config";

const getOrdersWithIncidentsTccMs = async () => {
  try {
    const query = `
        SELECT o.idOrder, oh.idCarrierStatusUpdate, o.carrierTrackingCode
        FROM orderShipmentUpdateHistory oh
        JOIN (
            SELECT idOrder, MAX(createdAt) AS lastUpdate
            FROM orderShipmentUpdateHistory
            GROUP BY idOrder
        ) AS lastStatus ON oh.idOrder = lastStatus.idOrder AND oh.createdAt = lastStatus.lastUpdate
        INNER JOIN carrierStatusUpdate cs ON oh.idCarrierStatusUpdate = cs.idCarrierStatusUpdate
        INNER JOIN \`order\` o ON oh.idOrder = o.idOrder AND o.idCarrier = 4
        WHERE cs.statusAuxLabel = 'CON-NOVEDAD'
          AND oh.carrierData NOT LIKE '%idNovedadTCC%';
        `;
    return await db.query(query, { type: QueryTypes.SELECT });
  } catch (error) {
    console.error("Error getting orders with incidents TCC:", error);
    throw error;
  }
};

const updateCarrierData = async ({ dataToInsert }: any) => {
  try {
    let query = `
        UPDATE orderShipmentUpdateHistory
        SET 
            carrierData = CASE
    `;

    dataToInsert.forEach(
      ({ idOrder, idCarrierStatusUpdate, incidentId, incidentData }: any) => {
        query += `
            WHEN idOrder = ${idOrder} AND idCarrierStatusUpdate = ${idCarrierStatusUpdate}
            THEN JSON_SET(
                IFNULL(carrierData, '{}'),
                '$.idNovedadTCC', '${incidentId}',
                '$.incidentData', '${JSON.stringify(incidentData)}',
                '$.idOrder', '${idOrder}'
            )
        `;
      }
    );
    query += `
            ELSE carrierData
        END,
        updatedAt = NOW()
        
    `;

    const idOrders = dataToInsert.map((data: any) => data.idOrder).join(", ");
    query += `WHERE idOrder IN (${idOrders});`;

    console.log("query =>>>", query);

    return await db.query(query, { type: QueryTypes.UPDATE });
  } catch (error) {
    console.error("Error updating carrier data:", error);
    throw error;
  }
};

export default {
  updateCarrierData,
  getOrdersWithIncidentsTccMs
};
