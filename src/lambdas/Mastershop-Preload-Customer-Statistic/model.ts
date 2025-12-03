import Dao from "./dao";
import Dto from "./dto";

class Model {
  private dao: Dao;

  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async preloadCache(phone: string) {
    const cleanPhone = Dto.sanitizePhone(phone);
    const customerStatistics =
      await this.retryGetCustomerStatistics(cleanPhone);
    console.log("customerStatistics :>>", customerStatistics);

    if (!customerStatistics) {
      throw new Error("Customer statistics not found");
    }

    const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

    await this.dao.setKeyInCache({
      key: `customerStatistics-${cleanPhone}`,
      value: customerStatistics,
      timeToLive: SEVEN_DAYS_IN_SECONDS
    });
  }

  private async retryGetCustomerStatistics(
    cleanPhone: string,
    attempt: number = 1
  ): Promise<any> {
    const delays = [2000, 5000, 10000, 20000, 30000, 60000, 120000, 240000]; // 2s, 5s, 10s, 20s, 30s, 1min, 2min, 4min

    try {
      console.log(`Attempting to get customer statistics (attempt ${attempt})`);
      return await this.dao.getCustomerStatistics(cleanPhone);
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt >= 8) {
        console.error("All retry attempts failed");
        throw error;
      }

      const delay = delays[attempt - 1];
      console.log(`Retrying in ${delay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryGetCustomerStatistics(cleanPhone, attempt + 1);
    }
  }
}

export default Model;
