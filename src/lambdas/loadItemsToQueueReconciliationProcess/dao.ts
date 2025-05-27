import axios from "axios";

import Database from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types";
import { config } from "./types";

class Dao {
  private db: Database;
  private environment: EnvironmentTypes;
  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
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
    const queueUrl = `${config.baseUrl}/${this.environment}/api/b2b/reconciliation/sendItems`;
    const result = await axios.post(queueUrl, message, {
      headers: {
        "x-app-name": config.appName,
        "x-api-key": config.apiKey
      }
    });
    return result.data;
  }
}

export default Dao;
