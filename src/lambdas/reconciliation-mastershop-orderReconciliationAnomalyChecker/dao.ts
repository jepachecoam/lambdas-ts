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
  private envoironment: string;
  constructor(environment: string) {
    this.db = new Database(environment);
    this.envoironment = environment;
  }

  async getOrder({ carrierTrackingCode }: { carrierTrackingCode: string }) {
    const tableName = `db_mastershop_orders${this.envoironment === "dev" ? "_dev" : ""}`;
    const query = `
                select o.idOrder, o.shippingRate, o.carrierInfo, o.totalSeller, o.paymentMethod from ${tableName}.order o where carrierTrackingCode = :carrierTrackingCode order by createdAt desc
    `;
    return this.db.fetchOne(query, { replacements: { carrierTrackingCode } });
  }

  async getOrderReturn({
    carrierTrackingCode
  }: {
    carrierTrackingCode: string;
  }) {
    const tableName = `db_mastershop_orders${this.envoironment === "dev" ? "_dev" : ""}`;
    const query = `
    select o.idOrder, ore.idOrderReturn, ore.shippingRate, o.carrierInfo, o.totalSeller, o.paymentMethod
    from ${tableName}.orderReturn ore
            inner join ${tableName}.order o on ore.idOrder = o.idOrder
    where o.carrierTrackingCode = :carrierTrackingCode or ore.carrierTrackingCode = :carrierTrackingCode
    order by ore.createdAt desc  
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
