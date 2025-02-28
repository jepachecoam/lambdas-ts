import { QueryTypes } from "sequelize";
import { OrderTableFilters } from "./enums";

import db from "./database/config";

const getOrders = async (params: OrderTableFilters) => {
  const query = `
    with userOrders
    as (select o.idOrder,   
               o.idProvider,
               o.idBussiness,
               o.idBussinessProvider,
               o.createdAt,
               json_object('email', c.email,
                           'phone', json_extract(o.shippingAddress, '$.phone'),
                           'fullName', json_extract(o.shippingAddress, '$.fullName')
               )       as userInfo,
               paymentMethod,
               totalSeller,
               totalProvider,
               cr.name as cancelReason
        from  \`order\` o
                 inner join status s
                            on o.idStatus = s.idStatus and s.statusParent = '${params.statusParent}' and s.name = '${params.status}'
                 left join customer c on o.idCustomer = c.idCustomer and email is not null
                 left join statusMessage cr ON o.idCancelReason = cr.idStatusMessage and cr.typeMessage = 'ORDER_CANCELATION'
        where o.idBussiness = ${params.idBusiness}
          AND o.idBussinessProvider = ${params.idBusiness}
        limit ${params.limit} offset ${params.offset}
        )                                           
   , orderItems as (select uo.idOrder,
                           json_arrayagg(JSON_OBJECT('name', p.name)) as items
                    from orderItem oi
                             inner join userOrders uo on oi.idOrder = uo.idOrder
                             inner join db_bemaster_aff.product p on oi.idProduct = p.idProduct -- NOMBRE DEL PRODUCTO
                    group by uo.idOrder)
   , orderAlerts as (select oa.idOrder, 
                            json_arrayagg(json_object(
                                    'idAlert', oa.idAlert,
                                    'type', sm.typeMessage,
                                    'name', sm.name
                                          )) as alerts
                     from orderAlert oa
                              inner join userOrders uo on oa.idOrder = uo.idOrder
                              left join statusMessage sm ON oa.idAlert = sm.idStatusMessage and sm.typeMessage = 'ALERT'
                     group by oa.idOrder)
   , countOrders as (select count(idOrder) as total from userOrders) 
   , finalData AS (SELECT uo.idOrder,
                          JSON_OBJECT(
                                  'idOrder', uo.idOrder,
                                  'items', oi.items,
                                  'alerts', oa.alerts,
                                  'idProvider', uo.idProvider,
                                  'idBusiness', uo.idBussiness,
                                  'idBusinessProvider', uo.idBussinessProvider,
                                  'createdAt', uo.createdAt,
                                  'userInfo', uo.userInfo,
                                  'paymentMethod', uo.paymentMethod,
                                  'totalSeller', uo.totalSeller,
                                  'totalProvider', uo.totalProvider,
                                  'cancelReason', uo.cancelReason
                          ) AS jsonData
                   FROM userOrders uo
                            LEFT JOIN orderItems oi ON oi.idOrder = uo.idOrder
                            LEFT JOIN orderAlerts oa ON oa.idOrder = uo.idOrder)
SELECT (SELECT total FROM countOrders) AS totalOrders,
       JSON_ARRAYAGG(jsonData)         AS data
FROM finalData;
`;

  console.log("query =>>>", query);
  const result = await db.query(query, {
    type: QueryTypes.SELECT
  });

  console.log("result =>>>", result);

  return result;
};

export default { getOrders };
