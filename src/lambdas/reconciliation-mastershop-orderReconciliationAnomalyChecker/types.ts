export enum StatusCodeEnum {
  MATCHED = 1,
  ORDER_NOT_FOUND = 2,
  CLOSED = 3,
  OVERCHARGED = 4,
  UNDERCHARGED = 5,
  ACCEPTABLE_OVERCHARGE = 6,
  UNKNOWN = 7,
  ERROR = 8,
  ACCEPTABLE_WITHIN_TOLERANCE = 9
}

export const getCarrierConf = (idCarrier: number) => {
  const carrierConfigurations: Record<number, any> = {
    4: { profitMargin: 0.05, copToleranceForOverCharge: 0.02 },
    6: { profitMargin: 0.05, copToleranceForOverCharge: 0.02 },
    7: { profitMargin: 0.05, copToleranceForOverCharge: 0.02 }
  };
  return carrierConfigurations[idCarrier] || null;
};
