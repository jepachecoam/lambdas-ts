import Database from "../../shared/databases/db-sm/sequelize-sm";

class Dao {
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }

  async getCustomerStatistics(phones: string[]) {
    const queryString = `
            WITH customers as (select idCustomer, phone from customer where phone in (${phones.join(", ")}))
            select c.idCustomer,
                  count(o.idOrder)                                                     cantOrders,
                  count(case when o.idStatus = 10 then o.idOrder end)                  cantReturOrders,
                  count(case when o.idStatus = 8 then o.idOrder end)                   delivered,
                  count(case when o.idStatus = 9 then o.idOrder end)                   canceled,
                  count(distinct case when cm.inBlackList = 1 then cm.idBussiness end) blockedBy,
                  COALESCE(
                          COUNT(CASE WHEN o.idStatus = 10 THEN o.idOrder END) /
                          NULLIF(
                                  COUNT(
                                          CASE
                                              WHEN o.idStatus IN (8, 10, 11)
                                                  OR (o.idStatus = 9 AND o.idCarrier = 8 AND o.idCancelReason = 58)
                                                  THEN o.idOrder
                                              END
                                  ),
                                  0
                          ),
                          0
                  ) AS                                                                 percentageReturn
            from db_mastershop_orders.order o
                    inner join customers c on o.idCustomer = c.idCustomer
                    inner join db_mastershop_orders.customer cm on c.idCustomer = cm.idCustomer and cm.isActive = 1
            group by c.idCustomer
            HAVING COUNT(o.idOrder) > 0;
        `;
    console.log("query: >>>", queryString);

    return this.db.fetchMany(queryString);
  }
}

export default Dao;
