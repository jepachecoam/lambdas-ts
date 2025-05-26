import { initCarrierChargeModel } from "../../shared/databases/models/carrierCharge";
import { initCarrierPaymentModel } from "../../shared/databases/models/carrierPayment";
import Database from "../../shared/databases/sequelize";
import S3 from "../../shared/services/S3";
import { EnvironmentTypes } from "../../shared/types";

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
    return carrierChargeModel.bulkCreate(records, {
      validate: true,
      updateOnDuplicate: [
        "idCarrier",
        "invoiceNumber",
        "chargeDate",
        "units",
        "actualWeight",
        "volumetricWeight",
        "billedWeight",
        "declaredValue",
        "fixedFreight",
        "variableFreight",
        "collectionCommission",
        "totalFreight",
        "businessUnit",
        "notes",
        "createdAt",
        "updatedAt",
        "totalCharge"
      ]
    });
  }

  async bulkInsertCarrierPayment(records: any[]) {
    const dbInstance = await this.db.getInstance();
    const carrierPaymentModel = initCarrierPaymentModel(dbInstance);
    return carrierPaymentModel.bulkCreate(records, {
      validate: true,
      updateOnDuplicate: [
        "idCarrier",
        "collectionDate",
        "notes",
        "paymentMethod",
        "amount",
        "paymentDate",
        "createdAt",
        "updatedAt"
      ]
    });
  }
}

export default Dao;
