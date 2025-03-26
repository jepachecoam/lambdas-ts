import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
  }

  async updateStatistics() {
    const originAndDestinationStats =
      await this.dao.getOriginAndDestinationStats({
        minOrdersRequired: 30
      });

    const returnStatisticsByStates = await this.dao.getReturnStatisticsByStates(
      { minOrdersRequired: 30 }
    );

    const returnStatisticsByCities = await this.dao.getReturnStatisticsByCities(
      {
        minOrdersRequired: 30
      }
    );

    console.log("originAndDestinationStats", originAndDestinationStats);
    console.log("returnStatisticsByStates", returnStatisticsByStates);
    console.log("returnStatisticsByCities", returnStatisticsByCities);
  }
}

export default Model;
