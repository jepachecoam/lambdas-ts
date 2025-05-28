import Dynamo from "../../shared/databases/dynamo";
import Database from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types";
import {
  getStatisticsInt,
  OriginAndDestinationStat,
  ReturnStatisticsByCities,
  ReturnStatisticsByStates
} from "./types";

class Dao {
  private db: Database;
  private dynamo: Dynamo;
  private environment: EnvironmentTypes;
  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
    this.dynamo = new Dynamo();
    this.environment = environment;
  }

  async getOriginAndDestinationStats({ minOrdersRequired }: getStatisticsInt) {
    const query = `
        with orders as (select o.idCarrier,
                       o.paymentMethod,
                       o.originAddress,
                       o.shippingAddress,
                       timestampdiff(hour, min(case when osl.idStatus = 6 then osl.createdAt end),
                                     max(case when osl.idStatus = 8 then osl.createdAt end)) as hourDiff
                from \`order\` o
                         inner join orderStatusLog osl on o.idOrder = osl.idOrder and osl.idStatus in (6, 8)
                where json_extract(o.originAddress, '$.cityDaneCode') is not null
                  and json_extract(o.shippingAddress, '$.cityDaneCode') is not null
                group by osl.idOrder)
        select o.idCarrier,
            if(o.paymentMethod = 'cod', 'cod', 'pia')                       as paymentMethod,
            json_unquote(json_extract(o.originAddress, '$.city'))           as originCityName,
            json_unquote(json_extract(o.originAddress, '$.cityDaneCode'))   as originCityDaneCode,
            json_unquote(json_extract(o.shippingAddress, '$.city'))         as shippingCityName,
            json_unquote(json_extract(o.shippingAddress, '$.cityDaneCode')) as shippingCityDaneCode,
            round(avg(hourDiff), 2)                                         as avgHourDiff,
            count(o.idCarrier)                                              as totalOrders
        from orders o
        group by o.idCarrier,
                o.paymentMethod,
                json_extract(o.originAddress, '$.cityDaneCode'),
                json_extract(o.shippingAddress, '$.cityDaneCode')
        having totalOrders >= :minOrdersRequired
        order by o.idCarrier;
          `;
    const result = await this.db.fetchMany(query, {
      replacements: { minOrdersRequired }
    });

    return result ? (result as OriginAndDestinationStat[]) : [];
  }

  async getReturnStatisticsByStates({ minOrdersRequired }: getStatisticsInt) {
    const query = `
            select o.idCarrier,
                json_extract(o.shippingAddress, '$.state')            as shippingStateName,
                if(o.paymentMethod = 'cod', 'cod', 'pia')             as paymentMethodGroup,
                count(o.idOrder)                                      as totalOrders,
                count(ore.idOrder)                                    as totalOrdersReturned,
                round(count(ore.idOrder) / count(o.idOrder) * 100, 2) as returnPercentage
            from \`order\` o
                    left join orderReturn ore on o.idOrder = ore.idOrder
            where o.idStatus in (8, 10, 11)
            group by o.idCarrier,
                    paymentMethodGroup,
                    shippingStateName
            having totalOrdersReturned >= :minOrdersRequired
            order by o.idCarrier;
          `;
    const result = await this.db.fetchMany(query, {
      replacements: { minOrdersRequired }
    });

    return result ? (result as ReturnStatisticsByStates[]) : [];
  }

  async getReturnStatisticsByCities({ minOrdersRequired }: getStatisticsInt) {
    const query = `
            select o.idCarrier,
                json_unquote(json_extract(o.shippingAddress, '$.city'))         as cityName,
                json_unquote(json_extract(o.shippingAddress, '$.cityDaneCode')) as shippingCityDaneCode,
                if(o.paymentMethod = 'cod', 'cod', 'pia')                       as paymentMethodGroup,
                count(o.idOrder)                                                as totalOrders,
                count(ore.idOrder)                                              as totalOrdersReturned,
                round(count(ore.idOrder) / count(o.idOrder) * 100, 2)           as returnPercentage
            from \`order\` o
                    left join orderReturn ore on o.idOrder = ore.idOrder and ore.idStatus = 8
            where o.idStatus in (8, 10, 11) 
            and json_extract(o.shippingAddress, '$.cityDaneCode') is not null
            group by o.idCarrier,
                    paymentMethodGroup,
                    shippingCityDaneCode
            having totalOrdersReturned >= :minOrdersRequired
            order by o.idCarrier;
          `;
    const result = await this.db.fetchMany(query, {
      replacements: { minOrdersRequired }
    });

    return result ? (result as ReturnStatisticsByCities[]) : [];
  }

  async putItem(tableName: string, item: Record<string, any>) {
    if (this.environment === "dev") {
      tableName = `${tableName}-Dev`; // revisar este cambio
    }
    return this.dynamo.putItem(tableName, item);
  }
}

export default Dao;
