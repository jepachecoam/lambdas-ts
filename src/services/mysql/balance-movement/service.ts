import { QueryTypes, Sequelize, Transaction } from "sequelize";
import { BalanceMovement } from "src/shared/entities";

import { executeSql } from "../utils";
import {
  balanceMovementEntityToModel,
  balanceMovementModelToEntity
} from "./mappers";
import { BalanceMovementModel } from "./types";

class BalanceMovementService {
  private db: Sequelize;

  public constructor(db: Sequelize) {
    this.db = db;
  }

  public async getByTransactionId(
    transactionId: string,
    transaction?: Transaction
  ): Promise<BalanceMovement[]> {
    const query = `SELECT * 
    FROM balanceMovement
    WHERE idTransaction = :idTransaction
    ORDER BY createdAt DESC`;

    const models = await executeSql<BalanceMovementModel[]>({
      db: this.db,
      query,
      type: QueryTypes.SELECT,
      data: { transactionId },
      errorMsg: "Error fetching balance movement",
      oneResult: true,
      transaction
    });
    return models.map(balanceMovementModelToEntity);
  }

  public async create(
    data: BalanceMovement,
    transaction?: Transaction
  ): Promise<number> {
    const params = balanceMovementEntityToModel(data);
    const query = `INSERT INTO balanceMovement
    (idUserAccount, balanceMovementDate, idTransaction, transactionDate, availableDate, transactionStatus, movementStatus, idBalanceMovementType, movementDetail, currency, movementValue, newBalance, withdrawnBalance, description, createdAt, updatedAt)
    VALUES
    (:idUserAccount, :balanceMovementDate, :idTransaction, :transactionDate, :availableDate, :transactionStatus, :movementStatus, :idBalanceMovementType, :movementDetail, :currency, :movementValue, :newBalance, :withdrawnBalance, :description, :createdAt, :updatedAt)`;
    return executeSql<number>({
      db: this.db,
      query,
      type: QueryTypes.INSERT,
      data: params,
      errorMsg: "Error creating balance movement",
      transaction
    });
  }

  public async update(
    data: BalanceMovement,
    transaction?: Transaction
  ): Promise<void> {
    const params = balanceMovementEntityToModel(data);
    const query = `UPDATE balanceMovement
    SET 
      idUserAccount = :idUserAccount,
      balanceMovementDate = :balanceMovementDate,
      idTransaction = :idTransaction,
      transactionDate = :transactionDate,
      availableDate = :availableDate,
      transactionStatus = :transactionStatus,
      movementStatus = :movementStatus,
      idBalanceMovementType = :idBalanceMovementType,
      movementDetail = :movementDetail,
      currency = :currency,
      movementValue = :movementValue,
      newBalance = :newBalance,
      withdrawnBalance = :withdrawnBalance,
      description = :description,
      updatedAt = :updatedAt
    WHERE idBalanceMovement = :idBalanceMovement`;
    await executeSql({
      db: this.db,
      query,
      type: QueryTypes.UPDATE,
      data: params,
      errorMsg: "Error updating balance movement",
      transaction
    });
  }
}

export { BalanceMovementService };
