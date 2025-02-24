type BalanceMovementModel = {
  idBalanceMovement?: number;
  idUserAccount: number;
  balanceMovementDate: string;
  idTransaction: string;
  transactionDate: string;
  availableDate: string;
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

export { BalanceMovementModel };
