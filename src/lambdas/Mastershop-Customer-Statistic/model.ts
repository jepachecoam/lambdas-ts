import Dao from "./dao";
import Dto from "./dto";

class Model {
  private dao: Dao;

  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async preloadCache(phone: string) {
    const cleanPhone = Dto.sanitizePhone(phone);
    const customerStatistics = await this.dao.getCustomerStatistics(cleanPhone);
    console.log("customerStatistics :>>", customerStatistics);

    if (!customerStatistics) {
      throw new Error("Customer statistics not found");
    }

    const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

    await this.dao.setKeyInCache({
      key: cleanPhone,
      value: `customerStatistics-${customerStatistics}`,
      timeToLive: SEVEN_DAYS_IN_SECONDS
    });
  }
}

export default Model;
