import Database from "../../shared/databases/sequelize";
import SQS from "../../shared/services/sqs";
import { EnvironmentTypes } from "../../shared/types";

class Dao {
  private db: Database;
  private SQS: SQS;

  private environment: EnvironmentTypes;
  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
    this.SQS = new SQS();
    this.environment = environment;
  }

  async getCarrierCharge() {
    const query = `
            select *
            from db_mastershop_reconciliation.carrierCharge
            where idCarrierCharge not in (select idCarrierCharge
                                          from db_mastershop_reconciliation.chargeReconciliation
                                          where idChargeStatus not in
                                                (select idChargeStatus
                                                 from db_mastershop_reconciliation.chargeStatus
                                                 where statusParent != 'resolved'))
            `;
    return await this.db.fetchMany(query);
  }
  async getCarrierPayments() {
    const query = `
            select *
            from db_mastershop_reconciliation.carrierPayment
            where idCarrierPayment not in (select idCarrierPayment
                                          from db_mastershop_reconciliation.paymentReconciliation
                                          where idPaymentStatus not in
                                                (select idPaymentStatus
                                                 from db_mastershop_reconciliation.paymentStatus
                                                 where statusParent != 'resolved'))
            `;
    return await this.db.fetchMany(query);
  }

  async sendToQueue(message: any) {
    let queueUrl = "";
    switch (this.environment) {
      case "dev":
        queueUrl = "";
        break;
      case "qa":
        queueUrl = "";
        break;
      case "prod":
        queueUrl = "";
        break;
    }
    return this.SQS.sendMessage(message, queueUrl);
  }
}

export default Dao;
