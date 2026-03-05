// model.ts — Business Logic Layer
//
// Rules for this file:
//   - Orchestrate workflows. Coordinate DAO calls. Apply business rules.
//   - NO direct DB access — all data access goes through this.dao.*
//   - Export as `export default class Model`.
//   - Methods are arrow function class properties (preserves `this` binding).
//   - Constructor receives `environment: string`, stores it, instantiates Dao.
//   - Catch errors, console.error them, then re-throw so the handler catches them.
//   - Use Promise.allSettled for parallel batch operations so one failure does
//     not abort the entire batch.

import Dao from "./dao";
import { IProcessInput, IProcessResult } from "./types";

class Model {
  private environment: string;
  private dao: Dao;

  constructor(environment: string) {
    this.environment = environment;
    this.dao = new Dao(environment);
  }

  // -------------------------------------------------------------------------
  // process — main entry point called by index.ts.
  // Name this method descriptively in real lambdas (e.g. processOrders,
  // validateCoverage, generateReport).
  // -------------------------------------------------------------------------
  process = async (params: IProcessInput): Promise<IProcessResult> => {
    try {
      console.log("Model.process params:", params);

      const record = await this.dao.fetchRecord(params.idOrder);

      if (!record) {
        throw new Error(`Record not found for idOrder: ${params.idOrder}`);
      }

      // Add business logic here.
      // Example of parallel batch with isolation:
      //
      // const results = await Promise.allSettled(
      //   items.map((item) => this.processOne(item))
      // );
      // const failures = results.filter((r) => r.status === "rejected");
      // if (failures.length > 0) {
      //   console.error("Some items failed:", failures);
      // }

      return { success: true, message: "Processed successfully" };
    } catch (error) {
      console.error("Error in Model.process:", error);
      throw error;
    }
  };
}

export default Model;
