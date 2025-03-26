import { QueryTypes, Sequelize } from "sequelize";

import getDatabaseInstance from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types";

class Dao {
  private db: Sequelize;
  constructor(environment: EnvironmentTypes) {
    this.db = getDatabaseInstance(environment);
  }

  async getOriginAndDestinationStats({
    minOrdersRequired,
    idCarriers
  }: {
    minOrdersRequired: number;
    idCarriers: number[];
  }) {
    const query = `
        with orders as (select o.idCarrier,
                       o.paymentMethod,
                       o.originAddress,
                       o.shippingAddress,
                       timestampdiff(hour, min(case when osl.idStatus = 6 then osl.createdAt end),
                                     max(case when osl.idStatus = 8 then osl.createdAt end)) as hourDiff
                from \`order\` o
                         inner join orderStatusLog osl on o.idOrder = osl.idOrder and osl.idStatus in (6, 8)
                where idCarrier in (${idCarriers.join(",")}) json_extract(o.originAddress, '$.cityDaneCode') is not null
                  and json_extract(o.shippingAddress, '$.cityDaneCode') is not null
                group by osl.idOrder)
        select o.idCarrier,
            if(o.paymentMethod = 'cod', 'cod', 'pia')                       as paymentMethod,
            json_unquote(json_extract(o.originAddress, '$.cityDaneCode'))   as originCity,
            json_unquote(json_extract(o.shippingAddress, '$.cityDaneCode')) as shippingCity,
            avg(hourDiff)                                                   as avgHourDiff,
            count(o.idCarrier)                                              as totalOrders
        from orders o
        group by o.idCarrier,
                o.paymentMethod,
                json_extract(o.originAddress, '$.cityDaneCode'),
                json_extract(o.shippingAddress, '$.cityDaneCode')
        having totalOrders >= ${minOrdersRequired}
        order by o.idCarrier;
          `;
    const result = await this.db.query(query, {
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result : null;
  }
}

export default Dao;
