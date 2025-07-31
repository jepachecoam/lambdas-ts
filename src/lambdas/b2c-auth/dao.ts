import CacheDB from "../../shared/databases/cache";

class Dao {
  private cacheDatabase: CacheDB;

  constructor(environment: string) {
    this.cacheDatabase = CacheDB.getInstance(environment);
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
