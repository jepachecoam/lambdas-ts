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
  ): Promise<boolean> {
    try {
      const query = `
        INSERT INTO customerPhone (idCustomer, phone)
        SELECT :idCustomer, :phone
        WHERE NOT EXISTS (
          SELECT 1 FROM customerPhone 
          WHERE idCustomer = :idCustomer AND phone = :phone
        )
      `;

      await this.db.insert(query, {
        replacements: { idCustomer, phone }
      });
      return true;
    } catch (error) {
      console.error("Error in createCustomerPhone:", error);
      throw error;
    }
  }

  async createCustomerExternalKey(
    idCustomer: number,
    externalId: string
  ): Promise<boolean> {
    try {
      const query = `
        INSERT INTO customerExternalKey (idCustomer, externalId)
        SELECT :idCustomer, :externalId
        WHERE NOT EXISTS (
          SELECT 1 FROM customerExternalKey 
          WHERE idCustomer = :idCustomer AND externalId = :externalId
        )
      `;

      await this.db.insert(query, {
        replacements: { idCustomer, externalId }
      });
      return true;
    } catch (error) {
      console.error("Error in createCustomerExternalKey:", error);
      throw error;
    }
  }

  async createCustomerAddress(
    idCustomer: number,
    address: any
  ): Promise<boolean> {
    try {
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

      await this.db.insert(query, {
        replacements: {
          idCustomer,
          address: JSON.stringify(address),
          state: address.state,
          city: address.city
        }
      });
      return true;
    } catch (error) {
      console.error("Error in createCustomerAddress:", error);
      throw error;
    }
  }

  async createCustomerEmail(
    idCustomer: number,
    email: string
  ): Promise<boolean> {
    try {
      const query = `
        INSERT INTO customerEmail (idCustomer, email)
        SELECT :idCustomer, :email
        WHERE NOT EXISTS (
          SELECT 1 FROM customerEmail 
          WHERE idCustomer = :idCustomer AND email = :email
        )
      `;

      await this.db.insert(query, {
        replacements: { idCustomer, email }
      });
      return true;
    } catch (error) {
      console.error("Error in createCustomerEmail:", error);
      throw error;
    }
  }

  async getAllActiveCustomers(): Promise<Customer[] | null> {
    const query =
      "SELECT * FROM customer WHERE isActive = 1 and idBussiness = 456";
    return this.db.fetchMany(query) as Promise<Customer[] | null>;
  }
  async reassignOrdersToWinner(
    oldCustomerId: number,
    newCustomerId: number
  ): Promise<void> {
    const ordersQuery =
      "SELECT idOrder FROM `order` WHERE idCustomer = :oldCustomerId";
    const orders = await this.db.fetchMany(ordersQuery, {
      replacements: { oldCustomerId }
    });

    if (orders) {
      const updateQuery =
        "UPDATE `order` SET idCustomer = :newCustomerId WHERE idCustomer = :oldCustomerId";
      await this.db.update(updateQuery, {
        replacements: { oldCustomerId, newCustomerId }
      });

      for (const order of orders as any[]) {
        await this.createOrderReassignmentRecord(
          order.idOrder,
          oldCustomerId,
          newCustomerId
        );
      }
    }
  }

  async createOrderReassignmentRecord(
    idOrder: number,
    oldCustomerId: number,
    newCustomerId: number
  ): Promise<void> {
    const query = `
      INSERT INTO customerOrderReassignment (idOrder, oldIdCustomer, newIdCustomer)
      VALUES (:idOrder, :oldCustomerId, :newCustomerId)
    `;
    await this.db.insert(query, {
      replacements: { idOrder, oldCustomerId, newCustomerId }
    });
  }

  async deactivateCustomer(idCustomer: number): Promise<void> {
    const query =
      "UPDATE customer SET isActive = 0 WHERE idCustomer = :idCustomer";
    await this.db.update(query, { replacements: { idCustomer } });
  }
}

export default Dao;
