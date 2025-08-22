import { Sequelize } from "sequelize";

const db = new Sequelize({
  dialect: "mysql",
  dialectOptions: { decimalNumbers: true },
  replication: {
    read: [
      {
        host: `${process.env["DB_HOST_READ_ONLY"]}`,
        username: `${process.env["DB_USER"]}`,
        password: `${process.env["DB_PASSWORD"]}`,
        database: `${process.env["DB_NAME"]}`
      }
    ],
    write: {
      host: `${process.env["DB_HOST"]}`,
      username: `${process.env["DB_USER"]}`,
      password: `${process.env["DB_PASSWORD"]}`,
      database: `${process.env["DB_NAME"]}`
    }
  },
  timezone: "+00:00",
  logging: false
});

export default db;
