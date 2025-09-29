import Database from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types/database";
import { Customer } from "./types";

class Dao {
  private db: Database;

  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
  }

  async createCustomerPhone(
    idCustomer: number,
    phone: string
  ): Promise<boolean | null> {
    const query = `
        INSERT INTO customerPhone (idCustomer, phone)
        SELECT :idCustomer, :phone
        WHERE NOT EXISTS (
          SELECT 1 FROM customerPhone 
          WHERE idCustomer = :idCustomer AND phone = :phone
        )
      `;
    return this.db.insert(query, {
      replacements: { idCustomer, phone }
    });
  }

  async createCustomerExternalKey(
    idCustomer: number,
    externalId: string
  ): Promise<boolean | null> {
    const query = `
        INSERT INTO customerExternalKey (idCustomer, externalId)
        SELECT :idCustomer, :externalId
        WHERE NOT EXISTS (
          SELECT 1 FROM customerExternalKey 
          WHERE idCustomer = :idCustomer AND externalId = :externalId
        )
      `;
    return this.db.insert(query, {
      replacements: { idCustomer, externalId }
    });
  }

  async createCustomerAddress(
    idCustomer: number,
    address: any
  ): Promise<boolean | null> {
    const query = `
        INSERT INTO customerAddress (idCustomer, address)
        SELECT :idCustomer, :address
        WHERE NOT EXISTS (
          SELECT 1 FROM customerAddress 
          WHERE idCustomer = :idCustomer 
          AND JSON_UNQUOTE(JSON_EXTRACT(address, '$.state')) = :state
          AND JSON_UNQUOTE(JSON_EXTRACT(address, '$.city')) = :city
        )
      `;
    return this.db.insert(query, {
      replacements: {
        idCustomer,
        address: JSON.stringify(address),
        state: address.state,
        city: address.city
      }
    });
  }

  async createCustomerEmail(
    idCustomer: number,
    email: string
  ): Promise<boolean | null> {
    const query = `
        INSERT INTO customerEmail (idCustomer, email)
        SELECT :idCustomer, :email
        WHERE NOT EXISTS (
          SELECT 1 FROM customerEmail 
          WHERE idCustomer = :idCustomer AND email = :email
        )
      `;

    return this.db.insert(query, {
      replacements: { idCustomer, email }
    });
  }

  async getAllActiveCustomers(): Promise<Customer[] | null> {
    const query = "SELECT * FROM customer WHERE isActive = 1";
    return this.db.fetchMany(query) as Promise<Customer[] | null>;
  }
  async getOrdersByCustomer(customerId: number): Promise<any[] | null> {
    const query = "SELECT idOrder FROM `order` WHERE idCustomer = :customerId";
    return this.db.fetchMany(query, {
      replacements: { customerId }
    });
  }

  async updateOrdersCustomer(
    oldCustomerId: number,
    newCustomerId: number
  ): Promise<boolean | null> {
    const query =
      "UPDATE `order` SET idCustomer = :newCustomerId WHERE idCustomer = :oldCustomerId";
    return this.db.update(query, {
      replacements: { oldCustomerId, newCustomerId }
    });
  }

  async createOrderReassignmentRecord(
    idOrder: number,
    oldCustomerId: number,
    newCustomerId: number
  ): Promise<boolean | null> {
    const query = `
      INSERT INTO customerOrderReassignment (idOrder, oldIdCustomer, newIdCustomer)
      VALUES (:idOrder, :oldCustomerId, :newCustomerId)
    `;
    return this.db.insert(query, {
      replacements: { idOrder, oldCustomerId, newCustomerId }
    });
  }

  async deactivateCustomer(idCustomer: number): Promise<boolean | null> {
    const query =
      "UPDATE customer SET isActive = 0 WHERE idCustomer = :idCustomer";
    return this.db.update(query, { replacements: { idCustomer } });
  }
}

export default Dao;
