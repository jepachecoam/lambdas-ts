import Database from "../../shared/databases/db-sm/sequelize-sm";

class Dao {
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }

  async getCustomerStatistics(phones: string[]) {
    const queryString = `
        WITH target_phones AS (SELECT DISTINCT phone, idCustomer
                        FROM (SELECT c.phone, c.idCustomer
                                FROM db_mastershop_orders.customer c
                                WHERE c.phone IN (:phones)
                                AND c.isActive = 1

                                UNION ALL

                                SELECT cp.phone, cp.idCustomer
                                FROM db_mastershop_orders.customerPhone cp
                                        JOIN db_mastershop_orders.customer c ON cp.idCustomer = c.idCustomer
                                WHERE cp.phone IN (:phones)
                                AND c.isActive = 1) AS mapping),
        customer_metrics AS (SELECT o.idCustomer,
                                        COUNT(o.idOrder)                                                     AS cantOrders,
                                        COUNT(CASE WHEN o.idStatus = 10 THEN 1 END)                          AS cantReturOrders,
                                        COUNT(CASE WHEN o.idStatus = 8 THEN 1 END)                           AS delivered,
                                        COUNT(CASE WHEN o.idStatus = 9 THEN 1 END)                           AS canceled,
                                        COUNT(DISTINCT CASE WHEN cm.inBlackList = 1 THEN cm.idBussiness END) AS blockedBy,
                                        COUNT(CASE
                                                WHEN o.idStatus IN (8, 10, 11)
                                                OR (o.idStatus = 9 AND o.idCarrier = 8 AND o.idCancelReason = 58)
                                                THEN 1 END
                                        )                                                                    AS returnDenominator
                                FROM db_mastershop_orders.order o
                                        INNER JOIN db_mastershop_orders.customer cm ON o.idCustomer = cm.idCustomer
                                WHERE cm.isActive = 1
                                AND o.idCustomer IN (SELECT idCustomer FROM target_phones)
                                GROUP BY o.idCustomer)
        SELECT tp.phone,
        SUM(COALESCE(m.cantOrders, 0))      AS cantOrders,
        SUM(COALESCE(m.cantReturOrders, 0)) AS cantReturOrders,
        SUM(COALESCE(m.delivered, 0))       AS delivered,
        SUM(COALESCE(m.canceled, 0))        AS canceled,
        SUM(COALESCE(m.blockedBy, 0))       AS blockedBy,
        COALESCE(
                SUM(m.cantReturOrders) / NULLIF(SUM(m.returnDenominator), 0),
                0
        )                                   AS percentageReturn
        FROM target_phones tp
                INNER JOIN customer_metrics m ON tp.idCustomer = m.idCustomer
        GROUP BY tp.phone;
        `;
    return this.db.fetchMany(queryString, {
      replacements: {
        phones: phones
      },
      logging: console.log
    });
  }
}

export default Dao;
