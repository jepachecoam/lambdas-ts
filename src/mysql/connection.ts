import { Sequelize } from "sequelize";
import mysql2 from "mysql2";

class MySqlDB {
  private static instance: Sequelize;

  private constructor() {}

  public static async getInstance(
    dbName: string,
    dbUser: string,
    dbPassword: string,
    dbHost: string,
    dbPort: string,
  ): Promise<Sequelize> {
    if (!MySqlDB.instance) {
      try {
        MySqlDB.instance = new Sequelize(dbName, dbUser, dbPassword, {
          host: dbHost,
          port: Number(dbPort),
          dialect: "mysql",
          dialectOptions: { decimalNumbers: true },
          dialectModule: mysql2,
          logging: false,
        });
        await MySqlDB.instance.authenticate();
      } catch (err: unknown) {
        throw new Error(
          `Error connecting to MySql, db: ${dbName}; ${(err as Error).message}`,
        );
      }
    }
    return MySqlDB.instance;
  }
}

export { MySqlDB };
