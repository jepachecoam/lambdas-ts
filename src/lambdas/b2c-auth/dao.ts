import axios from "axios";

import CacheDB from "../../shared/databases/cache";
import Database from "../../shared/databases/db-sm/sequelize-sm";
import { IUserRecord } from "./types";

class Dao {
  private cacheDatabase: CacheDB;
  private db?: Database;

  constructor(environment: string, db?: Database) {
    this.cacheDatabase = CacheDB.getInstance(environment);
    this.db = db;
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

  getUserByCognitoSub = async (
    cognitoSub: string
  ): Promise<IUserRecord | null> => {
    try {
      const query = `
        SELECT idUser, email, cognitoSub
        FROM user
        WHERE cognitoSub = :cognitoSub
      `;
      return this.db!.fetchOne(query, { replacements: { cognitoSub } });
    } catch (error) {
      console.error("Error in getUserByCognitoSub:", error);
      throw error;
    }
  };
}

export default Dao;
