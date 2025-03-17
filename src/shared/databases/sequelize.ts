import { Sequelize } from "sequelize";

const dbConfig = {
  dev: {
    database: `${process.env["DB_NAME_DEV"]}`,
    username: `${process.env["DB_USER_DEV"]}`,
    password: `${process.env["DB_PASSWORD_DEV"]}`,
    host: `${process.env["DB_HOST_DEV"]}`
  },
  prod: {
    database: `${process.env["DB_NAME_PROD"]}`,
    username: `${process.env["DB_USER_PROD"]}`,
    password: `${process.env["DB_PASSWORD_PROD"]}`,
    host: `${process.env["DB_HOST_PROD"]}`
  }
};

const getDatabaseInstance = (environment: "dev" | "prod") => {
  const { database, username, password, host } = dbConfig[environment];
  return new Sequelize(database, username, password, {
    host,
    dialect: "mysql",
    dialectOptions: { decimalNumbers: true },
    timezone: "+00:00",
    logging: (msg) => console.log(`Query =>>> ${msg}`)
  });
};

export default getDatabaseInstance;
