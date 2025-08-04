import axios from "axios";

import CacheDB from "../../shared/databases/cache";

class Dao {
  private cacheDatabase: CacheDB;

  constructor(environment: string) {
    this.cacheDatabase = CacheDB.getInstance(environment);
  }

  async userBusinessData(idBusiness: string, stage: string) {
    return axios.get(
      `${process.env["MS_API_URL"]}/${stage}/api/b2b/business/userBusiness/business/${idBusiness}`,
      {
        headers: {
          "x-app-name": `${process.env["MS_APP_NAME"]}`,
          "x-api-key": `${process.env["MS_API_KEY"]}`
        }
      }
    );
  }

  async getCachedItem({ key }: { key: string }) {
    return this.cacheDatabase.get({ key });
  }

  async storeCachedItem({ key, value }: { key: string; value: string }) {
    return this.cacheDatabase.set({
      key,
      value,
      expireInSeconds: Number(process.env["REDIS_TTL_IN_MINUTES"]) * 60
    });
  }
}

export default Dao;
