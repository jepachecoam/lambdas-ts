import Redis from "ioredis";

import config from "../../conf/config";

export class CacheDB {
  private static instance: CacheDB;
  private client: Redis | null = null;

  private environment: string;

  constructor(environment: string) {
    this.environment = environment;
  }

  static getInstance(environment: string): CacheDB {
    if (!CacheDB.instance) {
      CacheDB.instance = new CacheDB(environment);
    }
    return CacheDB.instance;
  }

  private initClient(): Redis {
    if (!this.client) {
      this.client = new Redis({
        host: config.redis.HOST,
        port: Number(config.redis.PORT),
        tls: {} // comentar en desarrollo local
      });

      this.client.on("connect", () => {
        console.debug("✅ Redis connected");
      });

      this.client.on("error", (err) => {
        console.error("❌ Redis error", err);
      });
    }
    return this.client;
  }

  async set({
    key,
    value,
    expireInSeconds
  }: {
    key: string;
    value: string;
    expireInSeconds?: number;
  }): Promise<"OK" | null> {
    const client = this.initClient();
    if (expireInSeconds) {
      return await client.set(
        `${key}-${this.environment}`,
        value,
        "EX",
        expireInSeconds
      );
    }
    return await client.set(key, value);
  }

  async get({ key }: { key: string }): Promise<string | null> {
    return await this.initClient().get(`${key}-${this.environment}`);
  }

  async delete({ key }: { key: string }): Promise<number> {
    return await this.initClient().del(`${key}-${this.environment}`);
  }

  async exists({ key }: { key: string }): Promise<boolean> {
    const result = await this.initClient().exists(`${key}-${this.environment}`);
    return result === 1;
  }

  async expire({
    key,
    seconds
  }: {
    key: string;
    seconds: number;
  }): Promise<boolean> {
    const result = await this.initClient().expire(
      `${key}-${this.environment}`,
      seconds
    );
    return result === 1;
  }

  async flushAll(): Promise<string> {
    return await this.initClient().flushall();
  }
}

export default CacheDB;
