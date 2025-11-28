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
    return b2bRequest.get(
      `${this.environment}/api/b2b/orderLogistics/customer/metrics/byPhone/${phone}?withoutCache=1`
    );
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
