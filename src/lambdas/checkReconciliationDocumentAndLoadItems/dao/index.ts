import S3 from "../../../shared/services/S3";
import Database from "../../../shared/services/sequelize";
import { EnvironmentTypes } from "../../../shared/types";
import { initCarrierChargeModel } from "./models/charge";
import { initCarrierPaymentModel } from "./models/payment";

class Dao {
  private S3 = new S3();
  private db: Database;

  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
  }
  async getStream(bucket: string, key: string) {
    return this.S3.getStream(bucket, key);
  }

  async bulkInsertCarrierCharge(records: any[]) {
    const dbInstance = await this.db.getInstance();
    const carrierChargeModel = initCarrierChargeModel(dbInstance);
    return await carrierChargeModel.bulkCreate(records, {
      updateOnDuplicate: ["carrierTrackingCode"]
    });
  }

  async bulkInsertCarrierPayment(records: any[]) {
    const dbInstance = await this.db.getInstance();
    const carrierPaymentModel = initCarrierPaymentModel(dbInstance);
    return await carrierPaymentModel.bulkCreate(records, {
      updateOnDuplicate: ["carrierTrackingCode"]
    });
  }
}

export default Dao;
