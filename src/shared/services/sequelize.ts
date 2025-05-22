import { QueryTypes, Sequelize, Transaction } from "sequelize";

import { EnvironmentTypes } from "../types";

const dbConfig = {
  dev: {
    database: `${process.env["DB_NAME_DEV"]}`,
    username: `${process.env["DB_USER_DEV"]}`,
    password: `${process.env["DB_PASSWORD_DEV"]}`,
    host: `${process.env["DB_HOST_DEV"]}`
  },
  qa: {
    database: `${process.env["DB_NAME_QA"]}`,
    username: `${process.env["DB_USER_QA"]}`,
    password: `${process.env["DB_PASSWORD_QA"]}`,
    host: `${process.env["DB_HOST_QA"]}`
  },
  prod: {
    database: `${process.env["DB_NAME_PROD"]}`,
    username: `${process.env["DB_USER_PROD"]}`,
    password: `${process.env["DB_PASSWORD_PROD"]}`,
    host: `${process.env["DB_HOST_PROD"]}`
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
