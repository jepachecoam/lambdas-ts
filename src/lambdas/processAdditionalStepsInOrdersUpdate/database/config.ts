import { Sequelize } from "sequelize";

const db = new Sequelize(
  `${process.env["DB_NAME"]}`,
  `${process.env["DB_USER"]}`,
  `${process.env["DB_PASSWORD"]}`,
  {
    host: `${process.env["DB_HOST"]}`,
    dialect: "mysql",
    dialectOptions: { decimalNumbers: true },
    timezone: "+00:00",
    logging: true
  }
);

export default db;
