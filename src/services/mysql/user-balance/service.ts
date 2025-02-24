import { QueryTypes, Sequelize, Transaction } from "sequelize";
import { executeSql } from "../utils";
import { UserBalance } from "src/shared/entities";
import { UserBalanceModel } from "./types";
import { userBalanceEntityToModel, userBalanceModelToEntity } from "./mappers";

class UserBalanceService {
  private db: Sequelize;

  public constructor(db: Sequelize) {
    this.db = db;
  }

  public async getOne(
    idUserAccount: number,
    currency: string,
    transaction?: Transaction,
  ): Promise<UserBalance | null> {
    let query = `SELECT * 
    FROM userBalance
    WHERE idUserAccount = :idUserAccount and currency = :currency`;
    if (transaction) query += " FOR UPDATE";

    const model = await executeSql<UserBalanceModel | null>({
      db: this.db,
      query,
      type: QueryTypes.SELECT,
      data: { idUserAccount, currency },
      errorMsg: "Error fetching product",
      oneResult: true,
      transaction,
    });
    return model && userBalanceModelToEntity(model);
  }

  public async create(
    data: UserBalance,
    transaction?: Transaction,
  ): Promise<number> {
    const params = userBalanceEntityToModel(data);
    const query = `INSERT INTO userBalance
    (idUserAccount, currency, totalBalance, availableBalance, createdAt, updatedAt)
    VALUES
    (:idUserAccount, :currency, :totalBalance, :availableBalance, :createdAt, :updatedAt)`;
    return executeSql<number>({
      db: this.db,
      query,
      type: QueryTypes.INSERT,
      data: params,
      errorMsg: "Error creating user balance",
      transaction,
    });
  }

  public async update(
    data: UserBalance,
    transaction?: Transaction,
  ): Promise<void> {
    const params = userBalanceEntityToModel(data);
    const query = `UPDATE userBalance
    SET 
      idUserBalance = :idUserBalance,
      idUserAccount = :idUserAccount,
      currency = :currency,
      totalBalance = :totalBalance,
      availableBalance = :availableBalance,
      updatedAt = :updatedAt
    WHERE idUserBalance = :idUserBalance`;
    await executeSql({
      db: this.db,
      query,
      type: QueryTypes.UPDATE,
      data: params,
      errorMsg: "Error updating user balance",
      transaction,
    });
  }
}

export { UserBalanceService };
