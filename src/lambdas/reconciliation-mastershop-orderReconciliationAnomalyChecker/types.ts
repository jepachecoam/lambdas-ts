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
  MISSING_DATA = 10
}

export enum operationTypeEnum {
  CHARGES = "CHARGES",
  PAYMENTS = "PAYMENTS"
}

export const getCarrierConf = (idCarrier: number) => {
  const carrierConfigurations: Record<number, any> = {
    4: { copToleranceForUnderCharge: 100 },
    6: { copToleranceForUnderCharge: 100 },
    7: { copToleranceForUnderCharge: 100 },
    8: { copToleranceForUnderCharge: 100 },
    9: { copToleranceForUnderCharge: 100 }
  };
  return carrierConfigurations[idCarrier] || null;
};

export enum Envs {
  ENVIRONMENT = "ENVIRONMENT"
}
