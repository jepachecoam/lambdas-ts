import { QueryTypes } from "sequelize";

import db from "./database/config";
import {
  OrderBy,
  OrderParentStatus,
  OrderTableFilters,
  RoleType
} from "./validations/interfaces";

const getOrders = async (params: OrderTableFilters): Promise<any> => {
  const userOrdersCTEConditionals: string[] = [];
  let orderBy: string | null = null;

  const offset = (params.pageNumber - 1) * params.pageSize;

  const paginationParams = `limit ${params.pageSize} offset ${offset}`;

  const shouldPaginationInFinal = !!params.productName || offset === 0;

  const cancelReasonIsRequired =
    params.orderStatusParent === OrderParentStatus.Finalizadas;

  const alertsAreRequired =
    params.orderStatusParent !== OrderParentStatus.Finalizadas;

  if (params.orderBy) {
    switch (params.orderBy) {
      case OrderBy.LeastRecent:
        orderBy = "uo.createdAt asc";
        break;
      case OrderBy.MostRecent:
        orderBy = "uo.createdAt desc";
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
               csm.name as confirmationStatusName,
               o.createdAt,
               json_object('email', c.email,
                           'phone', json_extract(o.shippingAddress, '$.phone'),
                           'fullName', json_extract(o.shippingAddress, '$.fullName'),
                           'fullName', json_extract(o.shippingAddress, '$.fullName'),
                           'city', json_extract(o.shippingAddress, '$.city'),
                           'state', json_extract(o.shippingAddress, '$.state'),
                           'address', json_extract(o.shippingAddress, '$.address1')
               ) as userInfo,
               paymentMethod,
               totalSeller,
               totalProvider,
               carrier.name as carrierName
               ${cancelReasonIsRequired ? ", cr.name as cancelReason" : ""}
        from  \`order\` o
                inner join status s on o.idStatus = s.idStatus and s.statusParent = '${params.orderStatusParent}' and s.name = '${params.orderStatus}'
                inner join customer c on o.idCustomer = c.idCustomer ${params.email ? `and c.email = '${params.email}'` : ""}
                inner join db_bemaster_aff.carrier carrier on o.idCarrier = carrier.idCarrier
                left join statusMessage csm on o.idConfirmationStatus = csm.idStatusMessage and csm.typeMessage = 'ORDER_CONFIRMATION'
                ${cancelReasonIsRequired ? "left join statusMessage cr ON o.idCancelReason = cr.idStatusMessage and cr.typeMessage = 'ORDER_CANCELATION'" : ""}
         where  (o.idUser = ${params.idUser} or (o.idProvider = ${params.idUser} and o.idStatus not in (1,2))) and ${userOrdersCTEConditionals.join(" and ")}
        ${shouldPaginationInFinal ? "" : paginationParams}
         )                                           
   , orderItems as (select uo.idOrder,
                           json_arrayagg(json_object('name',
                                                     if(v.name is not null, concat(p.name, ' - ', v.name),
                                                        p.name))) as items
                    from orderItem oi
                             inner join userOrders uo on oi.idOrder = uo.idOrder
                             inner join db_bemaster_aff.product p on oi.idProduct = p.idProduct
                             left join db_bemaster_aff.variant v
                                       on p.idProduct = v.idProduct and v.name != 'Default Variant' ${params.productName ? `and p.name like '%${params.productName}%'` : ""}
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
                              left join statusMessage sm on oa.idAlert = sm.idStatusMessage and sm.typeMessage = 'ALERT'
                     group by oa.idOrder) `
                        : ""
                    }
${
  offset === 0
    ? `
, countOrders as (select count(uo.idOrder) as orderCount,
                            sum(
                                    case
                                        when uo.idBussiness = 66056 then uo.totalSeller
                                        when uo.idBussinessProvider = 66056 then uo.totalProvider
                                        else 0 end
                            )                 as totalSales
                     from userOrders uo) 
, finalData as (select uo.idOrder,
                          json_object(
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
                                  'totalProvider', uo.totalProvider,
                                  'confirmationStatusName', uo.confirmationStatusName,
                                  'carrierName', uo.carrierName
                                  ${cancelReasonIsRequired ? ", 'cancelReason', uo.cancelReason" : ""}
                          ) as jsonData
                   from (select * from userOrders ${shouldPaginationInFinal ? paginationParams : ""}) as uo
                            inner join orderItems oi on oi.idOrder = uo.idOrder
                            ${alertsAreRequired ? "left join orderAlerts oa ON oa.idOrder = uo.idOrder" : ""} )
select (select orderCount from countOrders) as totalOrders,
       (select totalSales from countOrders) as totalSales,
       json_arrayagg(jsonData)              as data
from finalData;
`
    : `
select uo.idOrder, oi.items, 
${alertsAreRequired ? "oa.alerts," : ""}
uo.idProvider, uo.idBussiness, uo.idBussinessProvider, 
uo.createdAt, uo.userInfo, uo.paymentMethod, uo.totalSeller, uo.confirmationStatusName, uo.carrierName,
uo.totalProvider ${cancelReasonIsRequired ? ", uo.cancelReason" : ""} from userOrders uo
                            left join orderItems oi on oi.idOrder = uo.idOrder
                            ${alertsAreRequired ? "left join orderAlerts oa on oa.idOrder = uo.idOrder" : ""}
                            ${shouldPaginationInFinal ? paginationParams : ""}
${params.orderBy ? `order by ${orderBy} ` : "order by uo.createdAt desc"};
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
