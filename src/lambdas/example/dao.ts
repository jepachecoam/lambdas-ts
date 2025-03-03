import { QueryTypes } from "sequelize";

import db from "./database/config";
import {
  OrderBy,
  OrderParentStatus,
  OrderTableFilters,
  RoleType
} from "./validations/interfaces";

const getOrders = async (params: OrderTableFilters) => {
  const userOrdersCTEConditionals: string[] = [];
  let _orderBy: string | null = null;

  const paginationParams = `limit ${params.limit} offset ${params.offset}`;

  const shouldLimitInFinal = !!params.productName || params.offset === 0;

  const cancelReasonIsRequired =
    params.orderStatusParent === OrderParentStatus.Finalizadas;

  const alertsAreRequired =
    params.orderStatusParent !== OrderParentStatus.Finalizadas;

  if (params.orderBy) {
    switch (params.orderBy) {
      case OrderBy.HighestPrice:
        break;
      case OrderBy.LowestPrice:
        break;
      case OrderBy.LeastRecent:
        _orderBy = "uo.createdAt ASC";
        break;
      case OrderBy.MostRecent:
        _orderBy = "uo.createdAt DESC";
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
      userOrdersCTEConditionals.push("o.paymentMethod = 'cod'");
    } else {
      userOrdersCTEConditionals.push("o.paymentMethod != 'cod'");
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

  if (params.idWarehouses) {
    userOrdersCTEConditionals.push(
      `o.idWarehouse  in (${params.idWarehouses})`
    );
  }

  if (params.idConfirmationStatus) {
    userOrdersCTEConditionals.push(
      `o.idConfirmationStatus = ${params.idConfirmationStatus}`
    );
  }

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
               totalProvider
               ${cancelReasonIsRequired ? ", cr.name as cancelReason" : ""}
        from  \`order\` o
                 inner join status s
                            on o.idStatus = s.idStatus and s.statusParent = '${params.orderStatusParent}' and s.name = '${params.orderStatus}'
                 inner join customer c on o.idCustomer = c.idCustomer ${params.email ? `and c.email = '${params.email}'` : ""}
                 ${cancelReasonIsRequired ? "left join statusMessage cr ON o.idCancelReason = cr.idStatusMessage and cr.typeMessage = 'ORDER_CANCELATION'" : ""}
         where  (o.idUser = ${params.idUser} or (o.idProvider = ${params.idUser} and o.idStatus not in (1,2))) and ${userOrdersCTEConditionals.join(" and ")}
        ${shouldLimitInFinal ? "" : paginationParams}
         )                                           
   , orderItems as (select uo.idOrder,
                           json_arrayagg(JSON_OBJECT('name', p.name)) as items
                    from orderItem oi
                             inner join userOrders uo on oi.idOrder = uo.idOrder
                             inner join db_bemaster_aff.product p on oi.idProduct = p.idProduct ${params.productName ? `and p.name like '%${params.productName}%'` : ""}
                    group by uo.idOrder)
                    ${
                      alertsAreRequired
                        ? `, orderAlerts as (select oa.idOrder, 
                            json_arrayagg(json_object(
                                    'idAlert', oa.idAlert,
                                    'type', sm.typeMessage,
                                    'name', sm.name
                                          )) as alerts
                     from orderAlert oa
                              inner join userOrders uo on oa.idOrder = uo.idOrder
                              left join statusMessage sm ON oa.idAlert = sm.idStatusMessage and sm.typeMessage = 'ALERT'
                     group by oa.idOrder) `
                        : ""
                    }
   
${
  params.offset === 0
    ? `
, countOrders as (select count(idOrder) as total from userOrders) 
, finalData AS (SELECT uo.idOrder,
                          JSON_OBJECT(
                                  'idOrder', uo.idOrder,
                                  'items', oi.items,
                                  ${alertsAreRequired ? "'alerts', oa.alerts," : ""}
                                  'idProvider', uo.idProvider,
                                  'idBusiness', uo.idBussiness,
                                  'idBusinessProvider', uo.idBussinessProvider,
                                  'createdAt', uo.createdAt,
                                  'userInfo', uo.userInfo,
                                  'paymentMethod', uo.paymentMethod,
                                  'totalSeller', uo.totalSeller,
                                  'totalProvider', uo.totalProvider
                                  ${cancelReasonIsRequired ? ", 'cancelReason', uo.cancelReason" : ""}
                          ) AS jsonData
                   FROM (select * from userOrders ${shouldLimitInFinal ? paginationParams : ""}) as uo
                            inner join orderItems oi ON oi.idOrder = uo.idOrder
                            ${alertsAreRequired ? "left join orderAlerts oa ON oa.idOrder = uo.idOrder" : ""} )
SELECT (SELECT total FROM countOrders) AS totalOrders,
       JSON_ARRAYAGG(jsonData)         AS data
FROM finalData;
`
    : `
select uo.idOrder, oi.items, 
${alertsAreRequired ? "oa.alerts," : ""}
uo.idProvider, uo.idBussiness, uo.idBussinessProvider, 
uo.createdAt, uo.userInfo, uo.paymentMethod, uo.totalSeller, 
uo.totalProvider ${cancelReasonIsRequired ? ", uo.cancelReason" : ""} FROM userOrders uo
                            LEFT JOIN orderItems oi ON oi.idOrder = uo.idOrder
                            ${alertsAreRequired ? "LEFT JOIN orderAlerts oa ON oa.idOrder = uo.idOrder" : ""}
                            ${shouldLimitInFinal ? paginationParams : ""};
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
