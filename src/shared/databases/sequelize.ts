import { QueryTypes, Sequelize, Transaction } from "sequelize";

import config from "../../conf/config";
import { EnvironmentTypes } from "../types";

const dbConfig = {
  dev: {
    database: config.database.DB_NAME_DEV,
    username: config.database.DB_USER_DEV,
    password: config.database.DB_PASSWORD_DEV,
    host: config.database.DB_HOST_DEV
  },
  prod: {
    database: config.database.DB_NAME_PROD,
    username: config.database.DB_USER_PROD,
    password: config.database.DB_PASSWORD_PROD,
    host: config.database.DB_HOST_PROD
  }
};

const getDatabaseInstance = (environment: EnvironmentTypes) => {
  const configKey = ["prod", "qa"].includes(environment) ? "prod" : "dev";
  const { database, username, password, host } = dbConfig[configKey];

  return new Sequelize(database!, username!, password!, {
    host,
    dialect: "mysql",
    dialectOptions: { decimalNumbers: true },
    timezone: "+00:00",
    logging: (msg) =>
      console.log(`Environment(${environment}) -  Query =>>> ${msg}`)
  });
};

interface QueryOptions {
  replacements?: Record<string, any>;
  transaction?: Transaction;
}

export class Database {
  private db: Sequelize;

  constructor(environment: EnvironmentTypes) {
    this.db = getDatabaseInstance(environment);
  }

  async fetchOne(query: string, config?: QueryOptions) {
    const result = await this.db.query(query, {
      ...config,
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result[0] : null;
  }

  async fetchMany(query: string, config?: QueryOptions) {
    const result = await this.db.query(query, {
      ...config,
      type: QueryTypes.SELECT
    });
    return result && result.length > 0 ? result : null;
  }
}

export default Database;
