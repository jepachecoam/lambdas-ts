import { DateTime } from "luxon";

type UserBalance = {
  userBalanceId?: number;
  userAccountId: number;
  currency: string;
  totalBalance: number;
  availableBalance: number;
};

type BalanceMovement = {
  balanceMovementId?: number;
  userAccountId: number;
  balanceMovementDate: DateTime;
  idTransaction: string;
  transactionDate: DateTime;
  availableDate: DateTime;
  transactionStatus: string;
  movementStatus: string;
  idBalanceMovementType: number;
  movementDetail: unknown;
  currency: string;
  movementValue: number;
  newBalance: number;
  withdrawnBalance: number;
  description?: string;
};

export { UserBalance, BalanceMovement };
