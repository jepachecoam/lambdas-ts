import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";
import { statisticCategories } from "./types";
import { formattedDate } from "./utils";

class Model {
  private dao: Dao;
  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
  }

  async updateStatistics() {
    const promises = [];

    const [
      returnStatisticsByStates,
      returnStatisticsByCities,
      originAndDestinationStats
    ] = await Promise.all([
      this.dao.getReturnStatisticsByStates({
        minOrdersRequired: 30
      }),
      this.dao.getReturnStatisticsByCities({
        minOrdersRequired: 30
      }),
      this.dao.getOriginAndDestinationStats({
        minOrdersRequired: 30
      })
    ]);

    for (const state of returnStatisticsByStates) {
      const item = {
        pk: String(state.idCarrier),
        sk: `${state.paymentMethodGroup}-State-${state.shippingStateName}`,
        shippingStateName: state.shippingStateName,
        totalOrders: state.totalOrders,
        totalOrdersReturned: state.totalOrdersReturned,
        returnPercentage: state.returnPercentage,
        lastUpdate: formattedDate,
        category: statisticCategories.STATES_RETURN_STATISTICS
      };
      const response = this.dao.putItem("Mastershop-Carrier-Stats", item);
      promises.push(response);
    }

    for (const city of returnStatisticsByCities) {
      const item = {
        pk: String(city.idCarrier),
        sk: `${city.paymentMethodGroup}-City-${city.shippingCityDaneCode}`,
        shippingCityName: city.cityName,
        totalOrders: city.totalOrders,
        totalOrdersReturned: city.totalOrdersReturned,
        returnPercentage: city.returnPercentage,
        lastUpdate: formattedDate,
        category: statisticCategories.CITIES_RETURN_STATISTICS
      };
      const response = this.dao.putItem("Mastershop-Carrier-Stats", item);
      promises.push(response);
    }

    for (const stat of originAndDestinationStats) {
      const item = {
        pk: String(stat.idCarrier),
        sk: `${stat.paymentMethod}-${stat.originCityDaneCode}-${stat.shippingCityDaneCode}`,
        avgHourDiff: stat.avgHourDiff,
        totalOrders: stat.totalOrders,
        lastUpdate: formattedDate,
        category: statisticCategories.ORIGIN_AND_DESTINATION_AVG_HOUR_DIFF,
        originCityName: stat.originCityName,
        shippingCityName: stat.shippingCityName
      };
      const response = this.dao.putItem("Mastershop-Carrier-Stats", item);
      promises.push(response);
    }
    await Promise.all(promises);
    console.log("Statistics updated", promises.length);
  }
}

export default Model;
