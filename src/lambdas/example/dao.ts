// dao.ts — Data Access Layer
//
// Rules for this file:
//   - ALL DB queries, HTTP calls, S3, SQS, Secrets Manager access live here.
//   - NO business logic — fetch data and return it; let model.ts decide what to do.
//   - Export as `export default class Dao`.
//   - Methods are arrow function class properties (preserves `this` binding).
//   - Constructor receives `environment: string` and passes it to Database.
//   - Catch errors, console.error them, then re-throw so Model/handler catches them.
//
// Uncomment the imports you actually need and remove the rest.

import Database from "../../shared/databases/sequelize";
// import { CacheDB }        from "../../shared/databases/cache";
// import Dynamo             from "../../shared/databases/dynamo";
// import { b2bRequest }     from "../../shared/services/httpRequest";
// import SecretManager      from "../../shared/services/secretManager";
import { IProcessResult } from "./types";

class Dao {
  private environment: string;
  private db: Database;

  constructor(environment: string) {
    this.environment = environment;
    this.db = new Database(environment);
  }

  // -------------------------------------------------------------------------
  // Example: fetch a single row from MySQL (read-only replica).
  // Use fetchOne for a single row, fetchMany for multiple rows.
  // Use insert/update for writes (always go to the primary host).
  // -------------------------------------------------------------------------
  fetchRecord = async (idOrder: number): Promise<IProcessResult | null> => {
    try {
      const result = await this.db.fetchOne(
        "SELECT id, status FROM `order` WHERE idOrder = :idOrder LIMIT 1",
        { replacements: { idOrder } }
      );
      return result ?? null;
    } catch (error) {
      console.error("Error in Dao.fetchRecord:", error);
      throw error;
    }
  };

  // -------------------------------------------------------------------------
  // Example: idempotent INSERT using WHERE NOT EXISTS.
  // All INSERT operations MUST use WHERE NOT EXISTS to be safe under SQS
  // at-least-once delivery (duplicate messages will not create duplicate rows).
  // -------------------------------------------------------------------------
  // insertRecordIfNotExists = async (idOrder: number): Promise<boolean | null> => {
  //   try {
  //     return await this.db.insert(
  //       `INSERT INTO example_table (idOrder, createdAt)
  //        SELECT :idOrder, NOW()
  //        WHERE NOT EXISTS (
  //          SELECT 1 FROM example_table WHERE idOrder = :idOrder
  //        )`,
  //       { replacements: { idOrder } }
  //     );
  //   } catch (error) {
  //     console.error("Error in Dao.insertRecordIfNotExists:", error);
  //     throw error;
  //   }
  // };
}

export default Dao;
