import CacheDB from "../../shared/databases/cache";
import { b2bRequest } from "../../shared/services/httpRequest";

class Dao {
  private cacheDatabase: CacheDB;
  private environment: string;

  constructor(environment: string) {
    this.cacheDatabase = CacheDB.getInstance(environment);
    this.environment = environment;
  }

  async getCustomerStatistics(phone: string) {
    try {
      const result = await b2bRequest.get(
        `${this.environment}/api/b2b/orderLogistics/customer/metrics/byPhone/${phone}?withoutCache=1`
      );
      return result?.data?.data ?? null;
    } catch (error: any) {
      console.log("error :>>", error);
      return null;
    }
  }

  async setKeyInCache({
    key,
    value,
    timeToLive
  }: {
    key: string;
    value: any;
    timeToLive: number;
  }) {
    return this.cacheDatabase.set({
      key,
      value: JSON.stringify(value),
      expireInSeconds: timeToLive
    });
  }
}

export default Dao;
