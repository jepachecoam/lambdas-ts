import { QueryTypes, Sequelize, Transaction } from "sequelize";

import { dbEnv, EnvironmentTypes } from "../types";

const dbConfig = {
  dev: {
    database: `${process.env[dbEnv.DB_NAME_DEV]}`,
    username: `${process.env[dbEnv.DB_USER_DEV]}`,
    password: `${process.env[dbEnv.DB_PASSWORD_DEV]}`,
    host: `${process.env[dbEnv.DB_HOST_DEV]}`
  },
  qa: {
    database: `${process.env[dbEnv.DB_NAME_QA]}`,
    username: `${process.env[dbEnv.DB_USER_QA]}`,
    password: `${process.env[dbEnv.DB_PASSWORD_QA]}`,
    host: `${process.env[dbEnv.DB_HOST_QA]}`
  },
  prod: {
    database: `${process.env[dbEnv.DB_NAME_PROD]}`,
    username: `${process.env[dbEnv.DB_USER_PROD]}`,
    password: `${process.env[dbEnv.DB_PASSWORD_PROD]}`,
    host: `${process.env[dbEnv.DB_HOST_PROD]}`
  }
};

const getDatabaseInstance = (environment: EnvironmentTypes) => {
  try {
    if (!["dev", "qa", "prod"].includes(environment)) {
      throw new Error(`Invalid environment: ${environment}`);
    }

    const { database, username, password, host } = dbConfig[environment];

    return new Sequelize(database, username, password, {
      host,
      dialect: "mysql",
      dialectOptions: { decimalNumbers: true },
      timezone: "+00:00",
      logging: (msg) =>
        console.log(`Environment(${environment}) - Query =>>> ${msg}`)
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[DB_INIT_ERROR]: ${msg}`);
    throw err;
  }
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

  async getInstance() {
    return this.db;
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
