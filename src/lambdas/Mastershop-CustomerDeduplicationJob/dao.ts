import Database from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types/database";
import { Customer } from "./types";

class Dao {
  private db: Database;

  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
  }

  async getAllActiveCustomers(): Promise<Customer[] | null> {
    const query = `
    with ActiveBusines as (SELECT idBussiness,
                              MAX(createdAt) AS lastCreatedAtOrder
                       FROM \`order\` o
                       GROUP BY idBussiness
                       HAVING MAX(createdAt) >= NOW() - INTERVAL 30 DAY),
    BusinessWithMinData as (select idBussiness, count(*) as cant
                             from customer
                             group by idBussiness
                             having cant > 1)
    select c.idCustomer,
          c.idBussiness,
          c.fullName,
          c.firstName,
          c.lastName,
          c.email,
          c.phone,
          json_object(
                  'state', json_unquote(json_extract(defaultAddress, '$.state')),
                  'city', json_unquote(json_extract(defaultAddress, '$.city')),
                  'address1', json_unquote(json_extract(defaultAddress, '$.address1'))
          ) as defaultAddress,
          c.document
    from customer c
            inner join ActiveBusines ab on ab.idBussiness = c.idBussiness
            inner join BusinessWithMinData bwd on bwd.idBussiness = c.idBussiness
    where c.isActive = 1
    `;
    return this.db.fetchMany(query) as Promise<Customer[] | null>;
  }
}

export default Dao;
