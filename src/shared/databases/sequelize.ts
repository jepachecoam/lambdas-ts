import { QueryTypes, Sequelize, Transaction } from "sequelize";

import { dbEnv } from "../types/database";

const dbConfig = {
  dev: {
    database: process.env[dbEnv.DB_NAME_DEV]!,
    username: process.env[dbEnv.DB_USER_DEV]!,
    password: process.env[dbEnv.DB_PASSWORD_DEV]!,
    host: process.env[dbEnv.DB_HOST_DEV]!,
    hostReadOnly: process.env[dbEnv.DB_HOST_READ_ONLY_DEV]!
  },
  qa: {
    database: process.env[dbEnv.DB_NAME_QA]!,
    username: process.env[dbEnv.DB_USER_QA]!,
    password: process.env[dbEnv.DB_PASSWORD_QA]!,
    host: process.env[dbEnv.DB_HOST_QA]!,
    hostReadOnly: process.env[dbEnv.DB_HOST_READ_ONLY_QA]!
  },
  prod: {
    database: process.env[dbEnv.DB_NAME_PROD]!,
    username: process.env[dbEnv.DB_USER_PROD]!,
    password: process.env[dbEnv.DB_PASSWORD_PROD]!,
    host: process.env[dbEnv.DB_HOST_PROD]!,
    hostReadOnly: process.env[dbEnv.DB_HOST_READ_ONLY_PROD]!
  }
} as const;

type ValidEnvironment = keyof typeof dbConfig;

const isValidEnv = (env: string): env is ValidEnvironment => {
  return env === "dev" || env === "qa" || env === "prod";
};

const getDatabaseInstance = (environment: string): Sequelize => {
  if (!isValidEnv(environment)) {
    throw new Error(`Invalid environment: ${environment}`);
  }

  const { database, username, password, host, hostReadOnly } =
    dbConfig[environment];

  return new Sequelize(database, username, password, {
    replication: {
      read: [{ host: hostReadOnly }],
      write: { host }
    },
    dialect: "mysql",
    dialectOptions: { decimalNumbers: true },
    timezone: "+00:00",
    logging: ["dev", "qa"].includes(environment)
      ? (msg) => console.log(`Environment(${environment}) - Query =>>> ${msg}`)
      : false
  });
};

interface QueryOptions {
  replacements?: Record<string, any>;
  transaction?: Transaction;
}

class Database {
  private db: Sequelize;

  constructor(environment: string) {
    this.db = getDatabaseInstance(environment);
  }

  getInstance() {
    return this.db;
  }

  async fetchOne(query: string, config?: QueryOptions): Promise<any | null> {
    const result = await this.db.query(query, {
      ...config,
      type: QueryTypes.SELECT
    });
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  async fetchMany(query: string, config?: QueryOptions): Promise<any[] | null> {
    const result = await this.db.query(query, {
      ...config,
      type: QueryTypes.SELECT
    });
    return Array.isArray(result) && result.length > 0 ? result : null;
  }
  async insert(query: string, config?: QueryOptions): Promise<boolean | null> {
    const result = await this.db.query(query, {
      ...config,
      type: QueryTypes.INSERT
    });
    return Array.isArray(result) && result.length > 0 ? result[1] > 0 : null;
  }
  async update(query: string, config?: QueryOptions): Promise<boolean | null> {
    const result = await this.db.query(query, {
      ...config,
      type: QueryTypes.UPDATE
    });
    return Array.isArray(result) && result.length > 0 ? result[1] > 0 : null;
  }
}

export default Database;
