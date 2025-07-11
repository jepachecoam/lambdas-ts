import db from "../../conf/db";

const getOrdersWithIncidentsTccMs = async () => {
  const query = `
    with tccOrdersId as (select o.idOrder, o.carrierTrackingCode
                        from \`order\` o
                        where o.idCarrier = 4
                          and o.createdAt >= date_sub(now(), interval 1 month)),
        lastCreatedAt as (select osuh.idOrder, max(osuh.createdAt) as createdAt, tccOrdersId.carrierTrackingCode
                          from orderShipmentUpdateHistory osuh
                                    inner join tccOrdersId on tccOrdersId.idOrder = osuh.idOrder
                          group by tccOrdersId.idOrder)
    select osuh.idOrder, osuh.idOrderShipmentUpdate, lastCreatedAt.carrierTrackingCode, osuh.createdAt
    from orderShipmentUpdateHistory osuh
            inner join lastCreatedAt on lastCreatedAt.idOrder = osuh.idOrder and lastCreatedAt.createdAt = osuh.createdAt
            inner join carrierStatusUpdate csu
                        on osuh.idCarrierStatusUpdate = csu.idCarrierStatusUpdate and csu.statusAuxLabel = 'CON-NOVEDAD'
            inner join shipmentUpdate su on osuh.idShipmentUpdate = su.idShipmentUpdate and su.typeShipmentUpdate = 'TO-MANAGE'
    where osuh.carrierData NOT LIKE '%idNovedadTCC%';
        `;
  return db.fetchMany(query);
};

const updateCarrierData = async ({ dataToInsert }: any) => {
  let query = `
        UPDATE orderShipmentUpdateHistory
        SET 
            carrierData = CASE
    `;

  dataToInsert.forEach(
    ({ idOrder, idOrderShipmentUpdate, incidentId, incidentData }: any) => {
      query += `
            WHEN idOrder = ${idOrder} AND idOrderShipmentUpdate = ${idOrderShipmentUpdate}
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

  const whereCondition = dataToInsert
    .map(
      ({ idOrder, idOrderShipmentUpdate }: any) =>
        `(${idOrder}, ${idOrderShipmentUpdate})`
    )
    .join(", ");

  query += `
        WHERE (idOrder, idOrderShipmentUpdate) IN (${whereCondition});
    `;

  console.log("query =>>>", query);

  return db.update(query);
};

export default {
  updateCarrierData,
  getOrdersWithIncidentsTccMs
};
