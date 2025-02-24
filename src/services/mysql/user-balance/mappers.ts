import { UserBalance } from "src/shared/entities";

import { UserBalanceModel } from "./types";

function userBalanceModelToEntity(model: UserBalanceModel): UserBalance {
  return {
    userBalanceId: model.idUserBalance,
    userAccountId: model.idUserAccount,
    currency: model.currency,
    totalBalance: model.totalBalance,
    availableBalance: model.availableBalance
  };
}

function userBalanceEntityToModel(entity: UserBalance): UserBalanceModel {
  return {
    idUserBalance: entity.userBalanceId,
    idUserAccount: entity.userAccountId,
    currency: entity.currency,
    totalBalance: entity.totalBalance,
    availableBalance: entity.availableBalance
  };
}

export { userBalanceEntityToModel, userBalanceModelToEntity };
