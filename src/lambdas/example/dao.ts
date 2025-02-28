import { QueryTypes } from "sequelize";
import {
  OrderTableFilters,
  RoleType,
  OrderParentStatus,
  OrderBy
} from "./validations/interfaces";

import db from "./database/config";

const getOrders = async (params: OrderTableFilters) => {
  const userOrdersCTEConditionals: string[] = [];
  let orderBy: string | null = null;

  const limit = `limit ${params.limit} offset ${params.offset}`;
  let limitInFinal = !!params.productName || params.offset === 0;

  if (params.orderBy) {
    switch (params.orderBy) {
      case OrderBy.HighestPrice:
        break;
      case OrderBy.LowestPrice:
        break;
      case OrderBy.LeastRecent:
        orderBy = "uo.createdAt ASC";
        break;
      case OrderBy.MostRecent:
        orderBy = "uo.createdAt DESC";
        break;
    }
  }

  if (params.roleType) {
    switch (params.roleType) {
      case RoleType.Dropshipper:
        userOrdersCTEConditionals.push(
          `o.idBussiness = ${params.idBusiness} and o.idBussinessProvider != ${params.idBusiness}`
        );
        break;
      case RoleType.Supplier:
        userOrdersCTEConditionals.push(
          `o.idBussiness != ${params.idBusiness} and o.idBussinessProvider = ${params.idBusiness} and o.idStatus not in (1,2)`
        );
        break;
      case RoleType.BrandOwner:
        userOrdersCTEConditionals.push(
          `o.idBussiness = ${params.idBusiness} and o.idBussinessProvider = ${params.idBusiness}`
        );
        break;
    }
  } else {
    userOrdersCTEConditionals.push(
      `(o.idBussiness = ${params.idBusiness} or (o.idBussinessProvider = ${params.idBusiness} and o.idStatus not in (1,2)))`
    );
  }

  if (params.idOrder) {
    userOrdersCTEConditionals.push(`o.idOrder = ${params.idOrder}`);
  }

  if (params.paymentMethod) {
    if (params.paymentMethod.toLocaleLowerCase() === "cod") {
      userOrdersCTEConditionals.push(`o.paymentMethod = 'cod'`);
    } else {
      userOrdersCTEConditionals.push(`o.paymentMethod != 'cod'`);
    }
  }

  if (params.startDate) {
    userOrdersCTEConditionals.push(`o.createdAt >= '${params.startDate}'`);
  }

  if (params.finalDate) {
    userOrdersCTEConditionals.push(`o.createdAt <= '${params.finalDate}'`);
  }

  if (params.phone) {
    userOrdersCTEConditionals.push(
      `json_extract(o.shippingAddress, '$.phone') = '${params.phone}'`
    );
  }

  if (params.clientName) {
    userOrdersCTEConditionals.push(
      `json_extract(o.shippingAddress, '$.fullName') = '${params.clientName}'`
    );
  }

  const cancelReasonIsNeed =
    params.orderStatusParent === OrderParentStatus.Finalizadas;

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
               ${cancelReasonIsNeed ? "cr.name as cancelReason" : ""}
        from  \`order\` o
                 inner join status s
                            on o.idStatus = s.idStatus and s.statusParent = '${params.orderStatusParent}' and s.name = '${params.orderStatus}'
                 inner join customer c on o.idCustomer = c.idCustomer ${params.email ? `and c.email = '${params.email}'` : ""}
                 ${cancelReasonIsNeed ? "left join statusMessage cr ON o.idCancelReason = cr.idStatusMessage and cr.typeMessage = 'ORDER_CANCELATION'" : ""}
         where ${userOrdersCTEConditionals.join(" and ")}
        ${limitInFinal ? "" : limit}
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
${
  params.offset === 0
    ? `
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
FROM finalData ${limitInFinal ? limit : ""};
`
    : `
select uo.idOrder, oi.items, oa.alerts, 
uo.idProvider, uo.idBussiness, uo.idBussinessProvider, 
uo.createdAt, uo.userInfo, uo.paymentMethod, uo.totalSeller, 
uo.totalProvider, uo.cancelReason FROM userOrders uo
                            LEFT JOIN orderItems oi ON oi.idOrder = uo.idOrder
                            LEFT JOIN orderAlerts oa ON oa.idOrder = uo.idOrder 
                            ${limitInFinal ? limit : ""};
`
}
`;

  console.log("query =>>>", query);
  const result = await db.query(query, {
    type: QueryTypes.SELECT
  });

  return result;
};

export default { getOrders };
