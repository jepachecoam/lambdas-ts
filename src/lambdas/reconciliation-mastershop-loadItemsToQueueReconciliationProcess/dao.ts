import axios from "axios";

import Database from "../../shared/databases/sequelize";
import { EnvironmentTypes } from "../../shared/types/database";
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
          from db_mastershop_reconciliation.charge cr
          where cr.idCharge not in (select cre.idCharge
                                    from db_mastershop_reconciliation.chargeReconciliation cre
                                    where cre.idStatus not in
                                          (select s.idStatus
                                          from db_mastershop_reconciliation.status s
                                          where lower(statusParent) != 'resolved'))`;
    return await this.db.fetchMany(query);
  }
  async getCarrierPayments() {
    const query = `
          select *
          from db_mastershop_reconciliation.payment pa
          where pa.idPayment not in (select pr.idPayment
                                    from db_mastershop_reconciliation.paymentReconciliation pr
                                    where pr.idStatus not in
                                          (select s.idStatus
                                            from db_mastershop_reconciliation.status s
                                            where lower(statusParent) != 'resolved'))`;
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
