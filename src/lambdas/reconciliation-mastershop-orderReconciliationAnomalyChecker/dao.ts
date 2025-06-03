import {
  IChargeReconciliation,
  initChargeReconciliationModel
} from "../../shared/databases/models/chargeReconciliation";
import {
  initPaymentReconciliationModel,
  IPaymentReconciliation
} from "../../shared/databases/models/paymentReconciliation";
import Database from "../../shared/databases/sequelize";

class Dao {
  private db: Database;
  constructor(environment: string) {
    this.db = new Database(environment);
  }

  async getOrder({ carrierTrackingCode }: any) {
    const query = `
                select * from \`order\` where carrierTrackingCode = :carrierTrackingCode order by createdAt desc
    `;
    return this.db.fetchOne(query, { replacements: { carrierTrackingCode } });
  }

  async getOrderReturn({ carrierTrackingCode }: any) {
    const query = `
                select * from orderReturn where carrierTrackingCode = :carrierTrackingCode order by createdAt desc
    `;
    return this.db.fetchOne(query, { replacements: { carrierTrackingCode } });
  }

  async upsertChargeReconciliation(
    chargeReconciliation: IChargeReconciliation
  ) {
    const dbInstance = this.db.getInstance();
    const chargeReconciliationModel = initChargeReconciliationModel(dbInstance);
    return chargeReconciliationModel.upsert(chargeReconciliation);
  }

  async upsertPaymentReconciliation(
    paymentReconciliation: IPaymentReconciliation
  ) {
    const dbInstance = this.db.getInstance();
    const paymentReconciliationModel =
      initPaymentReconciliationModel(dbInstance);
    return paymentReconciliationModel.upsert(paymentReconciliation);
  }
}

export default Dao;
