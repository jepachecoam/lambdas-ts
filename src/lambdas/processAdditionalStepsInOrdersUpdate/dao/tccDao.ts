import { QueryTypes } from "sequelize";

import db from "../database/config";

const getOrdersWithIncidentsTccMs = async () => {
  try {
    const query = `
    with tccOrdersId as (select o.idOrder, o.carrierTrackingCode
                        from \`order\` o
                        where o.idCarrier = 4
                          and o.createdAt >= date_sub(now(), interval 1 month)),
        lastCreatedAt as (select osuh.idOrder, max(osuh.createdAt) as createdAt, tccOrdersId.carrierTrackingCode
                          from orderShipmentUpdateHistory osuh
                                    inner join tccOrdersId on tccOrdersId.idOrder = osuh.idOrder
                          group by tccOrdersId.idOrder)
    select osuh.idOrder, osuh.idCarrierStatusUpdate, lastCreatedAt.carrierTrackingCode, osuh.createdAt
    from orderShipmentUpdateHistory osuh
            inner join lastCreatedAt on lastCreatedAt.idOrder = osuh.idOrder and lastCreatedAt.createdAt = osuh.createdAt
            inner join carrierStatusUpdate csu
                        on osuh.idCarrierStatusUpdate = csu.idCarrierStatusUpdate and csu.statusAuxLabel = 'CON-NOVEDAD'
            inner join shipmentUpdate su on osuh.idShipmentUpdate = su.idShipmentUpdate and su.typeShipmentUpdate = 'TO-MANAGE'
    where osuh.carrierData NOT LIKE '%idNovedadTCC%';
        `;
    const result = await db.query(query, { type: QueryTypes.SELECT });
    return result.length > 0 ? result : null;
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
