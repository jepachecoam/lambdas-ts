import Dao from "./dao";
import Dto from "./dto";

class Model {
  private dao: Dao;

  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async preloadCache(phone: string) {
    const customerStatistics = await this.retryGetCustomerStatistics(phone);
    console.log("customerStatistics :>>", customerStatistics);
  }

  private async retryGetCustomerStatistics(
    phone: string,
    attempt: number = 1
  ): Promise<any> {
    const delays = [2000, 5000, 10000, 20000, 30000, 60000, 120000, 240000]; // 2s, 5s, 10s, 20s, 30s, 1min, 2min, 4min

    try {
      console.log(`Attempting to get customer statistics (attempt ${attempt})`);
      return await this.dao.getCustomerStatistics(phone);
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);

      // Don't retry if it's a 404 error
      if (error?.response?.status === 404) {
        console.log("404 error detected, not retrying");
        throw error;
      }

      if (attempt >= 8) {
        console.error("All retry attempts failed");
        throw error;
      }

      const delay = delays[attempt - 1];
      console.log(`Retrying in ${delay / 1000} seconds...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryGetCustomerStatistics(phone, attempt + 1);
    }
  }
}

export default Model;
