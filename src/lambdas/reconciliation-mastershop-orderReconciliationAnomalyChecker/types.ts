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
    4: { copToleranceForOverCharge: 100 },
    6: { copToleranceForOverCharge: 100 },
    7: { copToleranceForOverCharge: 100 },
    8: { copToleranceForOverCharge: 100 }
  };
  return carrierConfigurations[idCarrier] || null;
};

export enum Envs {
  ENVIRONMENT = "ENVIRONMENT"
}
