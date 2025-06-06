import { IChargeReconciliation } from "../../shared/databases/models/chargeReconciliation";
import { IPaymentReconciliation } from "../../shared/databases/models/paymentReconciliation";

export enum StatusCodeEnum {
  MATCHED = 1,
  ORDER_NOT_FOUND = 2,
  CLOSED = 3,
  OVERCHARGED = 4,
  UNDERCHARGED = 5,
  ACCEPTABLE_OVERCHARGE = 6,
  UNKNOWN = 7,
  ERROR = 8,
  ACCEPTABLE_UNDERCHARGE = 9,
  MISSING_DATA = 10,
  UNEXPECTED_DATA = 11,
  UNDERPAID = 12,
  OVERPAID = 13
}

export enum IdCarriers {
  TCC = 4,
  COORDINADORA = 6,
  ENVIA = 7,
  SWAYP = 8,
  INTERRAPIDISIMO = 9
}

export enum operationTypeEnum {
  CHARGES = "CHARGES",
  PAYMENTS = "PAYMENTS"
}

export enum Envs {
  ENVIRONMENT = "ENVIRONMENT"
}

export type ICustomChargeReconciliation = Omit<
  IChargeReconciliation,
  "idCharge"
> & {
  idCharge?: number;
};

export type ICustomPaymentReconciliation = Omit<
  IPaymentReconciliation,
  "idPayment"
> & {
  idPayment?: number;
};
