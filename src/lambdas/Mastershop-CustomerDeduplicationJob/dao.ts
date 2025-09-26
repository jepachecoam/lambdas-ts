import { QueryTypes } from "sequelize";

import Database from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types/database";
import { Customer, ResolveIdCustomerRequest } from "./types/interfaces";

class Dao {
  private db: Database;

  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
  }

  async searchCustomerCandidates(
    searchData: ResolveIdCustomerRequest
  ): Promise<Customer[] | null> {
    try {
      const baseConditions: string[] = [];
      const searchConditions: string[] = [];
      const replacements: Record<string, any> = {};

      baseConditions.push("c.idUser = :idUser");
      replacements["idUser"] = searchData.idUser;

      baseConditions.push("c.idBussiness = :idBusiness");
      replacements["idBusiness"] = searchData.idBusiness;

      baseConditions.push("c.isActive = 1");

      if (searchData.phone) {
        searchConditions.push(
          "(c.phone LIKE :phone OR cp.phone LIKE :phone OR JSON_UNQUOTE(JSON_EXTRACT(c.defaultAddress, '$.phone')) LIKE :phone)"
        );
        replacements["phone"] = `%${searchData.phone}%`;
      }

      if (searchData.email) {
        searchConditions.push("(c.email = :email OR ce.email = :email)");
        replacements["email"] = searchData.email;
      }

      if (searchData.document) {
        searchConditions.push(
          "(c.document = :document OR JSON_UNQUOTE(JSON_EXTRACT(c.defaultAddress, '$.company')) = :document)"
        );
        replacements["document"] = searchData.document;
      }

      if (searchData.externalId) {
        searchConditions.push("cek.externalId = :externalId");
        replacements["externalId"] = searchData.externalId;
      }

      if (searchData.fullName) {
        searchConditions.push(
          "(c.fullName LIKE :fullName OR JSON_UNQUOTE(JSON_EXTRACT(c.defaultAddress, '$.full_name')) LIKE :fullName)"
        );
        replacements["fullName"] = `%${searchData.fullName}%`;
      }

      if (searchData.firstName) {
        searchConditions.push(
          "(c.firstName LIKE :firstName OR JSON_UNQUOTE(JSON_EXTRACT(c.defaultAddress, '$.first_name')) LIKE :firstName)"
        );
        replacements["firstName"] = `%${searchData.firstName}%`;
      }

      if (searchData.lastName) {
        searchConditions.push(
          "(c.lastName LIKE :lastName OR JSON_UNQUOTE(JSON_EXTRACT(c.defaultAddress, '$.last_name')) LIKE :lastName)"
        );
        replacements["lastName"] = `%${searchData.lastName}%`;
      }

      if (searchData.address) {
        if (searchData.address.state) {
          searchConditions.push(
            "(JSON_UNQUOTE(JSON_EXTRACT(c.defaultAddress, '$.state')) LIKE :addressState OR JSON_UNQUOTE(JSON_EXTRACT(ca.address, '$.state')) LIKE :addressState)"
          );
          replacements["addressState"] = `%${searchData.address.state}%`;
        }

        if (searchData.address.city) {
          searchConditions.push(
            "(JSON_UNQUOTE(JSON_EXTRACT(c.defaultAddress, '$.city')) LIKE :addressCity OR JSON_UNQUOTE(JSON_EXTRACT(ca.address, '$.city')) LIKE :addressCity)"
          );
          replacements["addressCity"] = `%${searchData.address.city}%`;
        }
      }

      const query = `
        SELECT DISTINCT
          c.idCustomer,
          c.idUser,
          c.idBussiness,
          c.fullName,
          c.firstName,
          c.lastName,
          c.email,
          c.phone,
          c.isActive,
          c.defaultAddress,
          c.tags,
          c.documentType,
          c.document,
          c.inBlackList,
          c.dateInBlackList,
          c.createdAt,
          c.updatedAt,
          cek.externalId
        FROM customer c
        LEFT JOIN customerAddress ca ON c.idCustomer = ca.idCustomer
        LEFT JOIN customerExternalKey cek ON c.idCustomer = cek.idCustomer
        LEFT JOIN customerPhone cp ON c.idCustomer = cp.idCustomer
        LEFT JOIN customerEmail ce ON c.idCustomer = ce.idCustomer
        WHERE ${baseConditions.join(" AND ")} 
        AND (${searchConditions.join(" OR ")})
      `;

      const result = await this.db.fetchMany(query, { replacements });
      return result && result.length > 0 ? (result as Customer[]) : null;
    } catch (error) {
      console.error("Error in searchCustomerCandidates:", error);
      throw error;
    }
  }

  async createCustomer(
    customerData: ResolveIdCustomerRequest
  ): Promise<number> {
    try {
      const query = `
        INSERT INTO customer (
          idUser, idBussiness, fullName, firstName, lastName, 
          email, phone, defaultAddress, tags, documentType, document
        ) VALUES (
          :idUser, :idBusiness, :fullName, :firstName, :lastName,
          :email, :phone, :defaultAddress, :tags, :documentType, :document
        )
      `;

      const result = await this.db.getInstance().query(query, {
        type: QueryTypes.INSERT,
        replacements: {
          idUser: customerData.idUser,
          idBusiness: customerData.idBusiness,
          fullName: customerData.fullName,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
          defaultAddress: customerData.address
            ? JSON.stringify(customerData.address)
            : null,
          tags: customerData.tags ? JSON.stringify(customerData.tags) : null,
          documentType: customerData.documentType,
          document: customerData.document
        }
      });

      // Para MySQL, el insertId está en result[0]
      const insertResult = result as any;
      const idCustomer =
        insertResult[0] || insertResult.insertId || insertResult[0]?.insertId;

      if (!idCustomer) {
        throw new Error("Failed to get customer ID after insertion");
      }

      if (customerData.externalId) {
        await this.createCustomerExternalKey(
          idCustomer,
          customerData.externalId
        );
      }

      return idCustomer;
    } catch (error) {
      console.error("Error in createCustomer:", error);
      throw error;
    }
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
    const query = "SELECT * FROM customer WHERE isActive = 1";
    return this.db.fetchMany(query) as Promise<Customer[] | null>;
  }

  async updateCustomer(
    idCustomer: number,
    data: Partial<Customer>
  ): Promise<boolean> {
    const fields = Object.keys(data)
      .map((key) => `${key} = :${key}`)
      .join(", ");
    const query = `UPDATE customer SET ${fields} WHERE idCustomer = :idCustomer`;
    return this.db.update(query, {
      replacements: { ...data, idCustomer }
    }) as Promise<boolean>;
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

  async createAuditRecord(
    duplicateId: number,
    winnerId: number
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO customerDeduplicationAudit (duplicateCustomerId, winnerCustomerId, mergedAt)
        VALUES (:duplicateId, :winnerId, NOW())
      `;
      await this.db.insert(query, { replacements: { duplicateId, winnerId } });
    } catch (error) {
      console.error("Error in createAuditRecord:", error);
      // No throw error para que no falle el proceso si no existe la tabla de auditoría
    }
  }

  async deactivateCustomer(idCustomer: number): Promise<void> {
    const query =
      "UPDATE customer SET isActive = 0 WHERE idCustomer = :idCustomer";
    await this.db.update(query, { replacements: { idCustomer } });
  }
}

export default Dao;
