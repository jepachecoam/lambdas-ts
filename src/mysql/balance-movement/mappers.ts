import { DateTime } from "luxon";
import { BalanceMovement } from "src/shared/entities";
import { BalanceMovementModel } from "./types";

function balanceMovementModelToEntity(
  model: BalanceMovementModel,
): BalanceMovement {
  return {
    balanceMovementId: model.idBalanceMovement,
    userAccountId: model.idUserAccount,
    balanceMovementDate: DateTime.fromISO(model.balanceMovementDate),
    idTransaction: model.idTransaction,
    transactionDate: DateTime.fromISO(model.transactionDate),
    availableDate: DateTime.fromISO(model.availableDate),
    transactionStatus: model.transactionStatus,
    movementStatus: model.movementStatus,
    idBalanceMovementType: model.idBalanceMovementType,
    movementDetail: model.movementDetail,
    currency: model.currency,
    movementValue: model.movementValue,
    newBalance: model.newBalance,
    withdrawnBalance: model.withdrawnBalance,
    description: model.description,
  };
}

function balanceMovementEntityToModel(
  entity: BalanceMovement,
): BalanceMovementModel {
  return {
    idBalanceMovement: entity.balanceMovementId,
    idUserAccount: entity.userAccountId,
    balanceMovementDate: entity.balanceMovementDate.toFormat(
      "yyyy-MM-dd HH:mm:ss",
    ),
    idTransaction: entity.idTransaction,
    transactionDate: entity.transactionDate.toFormat("yyyy-MM-dd HH:mm:ss"),
    availableDate: entity.availableDate.toFormat("yyyy-MM-dd HH:mm:ss"),
    transactionStatus: entity.transactionStatus,
    movementStatus: entity.movementStatus,
    idBalanceMovementType: entity.idBalanceMovementType,
    movementDetail: entity.movementDetail,
    currency: entity.currency,
    movementValue: entity.movementValue,
    newBalance: entity.newBalance,
    withdrawnBalance: entity.withdrawnBalance,
    description: entity.description,
  };
}

export { balanceMovementModelToEntity, balanceMovementEntityToModel };
