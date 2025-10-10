import Database from "../../shared/databases/sequelize";

class Dao {
  private db: Database;

  constructor(environment: string) {
    this.db = new Database(environment);
  }

  async batchDeactivateCustomers(
    customerIds: number[]
  ): Promise<boolean | null> {
    if (customerIds.length === 0) return true;
    const query = `UPDATE customer SET isActive = 0 WHERE idCustomer IN (${customerIds.join(",")})`;
    return this.db.update(query);
  }

  async batchCreateOrderReassignmentRecords(
    oldCustomerIds: number[],
    newCustomerId: number
  ): Promise<boolean | null> {
    if (oldCustomerIds.length === 0) return true;

    const query = `
      INSERT INTO customerOrderReassignment (idOrder, oldIdCustomer, newIdCustomer)
      SELECT idOrder, idCustomer, ${newCustomerId} 
      FROM \`order\` 
      WHERE idCustomer IN (${oldCustomerIds.join(",")})
    `;
    return this.db.insert(query);
  }

  async batchUpdateOrdersCustomer(
    oldCustomerIds: number[],
    newCustomerId: number
  ): Promise<boolean | null> {
    if (oldCustomerIds.length === 0) return true;

    const query = `UPDATE \`order\` SET idCustomer = ${newCustomerId} WHERE idCustomer IN (${oldCustomerIds.join(",")})`;
    return this.db.update(query);
  }

  async batchCreateCustomerPhones(
    idCustomer: number,
    phones: string[]
  ): Promise<boolean | null> {
    if (phones.length === 0) return true;

    const values = phones
      .map((phone) => `(${idCustomer}, '${phone}')`)
      .join(",");
    const query = `
      INSERT IGNORE INTO customerPhone (idCustomer, phone)
      VALUES ${values}
    `;
    return this.db.insert(query);
  }

  async batchCreateCustomerEmails(
    idCustomer: number,
    emails: string[]
  ): Promise<boolean | null> {
    if (emails.length === 0) return true;

    const values = emails
      .map((email) => `(${idCustomer}, '${email}')`)
      .join(",");
    const query = `
      INSERT IGNORE INTO customerEmail (idCustomer, email)
      VALUES ${values}
    `;
    return this.db.insert(query);
  }

  async batchCreateCustomerAddresses(
    idCustomer: number,
    addresses: any[]
  ): Promise<boolean | null> {
    if (addresses.length === 0) return true;

    const values = addresses
      .map(
        (address) =>
          `(${idCustomer}, '${JSON.stringify(address).replace(/'/g, "\\'")}')`
      )
      .join(",");

    const query = `
      INSERT IGNORE INTO customerAddress (idCustomer, address)
      VALUES ${values}
    `;
    return this.db.insert(query);
  }
}

export default Dao;
