import { QueryOptions, QueryTypes, Sequelize } from "sequelize";

interface DatabaseConfig {
  database: string;
  username: string;
  password: string;
  host: string;
  hostReadOnly?: string;
}

class Database {
  private db: Sequelize;

  constructor(config: DatabaseConfig) {
    const { database, username, password, host, hostReadOnly } = config;

    this.db = new Sequelize(database, username, password, {
      replication: {
        read: [{ host: hostReadOnly || host }],
        write: { host }
      },
      dialect: "mysql",
      dialectOptions: { decimalNumbers: true },
      timezone: "+00:00",
      logging: false
    });
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
