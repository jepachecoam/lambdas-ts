import { QueryTypes, Sequelize, Transaction } from "sequelize";

type QueryOptions = {
  db: Sequelize;
  query: string;
  type: QueryTypes;
  data: TimestampedData;
  errorMsg: string;
  oneResult?: boolean;
  transaction?: Transaction;
};

interface TimestampedData {
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export { QueryOptions, TimestampedData };
