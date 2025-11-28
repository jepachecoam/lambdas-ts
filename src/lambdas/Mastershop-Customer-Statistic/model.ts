import Dao from "./dao";

class Model {
  private dao: Dao;

  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async preloadCache(phone: string) {
    const customerStatistics = await this.dao.getCustomerStatistics(phone);
    console.log("customerStatistics :>>", customerStatistics);

    const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

    await this.dao.setKeyInCache({
      key: phone,
      value: customerStatistics,
      timeToLive: SEVEN_DAYS_IN_SECONDS
    });
  }
}

export default Model;
