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
  let conf = null;
  switch (idCarrier) {
    case 4:
      conf = {
        profitMargin: 0.05,
        copToleranceForOverCharge: 0.02
      };
      break;
    case 6:
      conf = {
        profitMargin: 0.05,
        copToleranceForOverCharge: 0.02
      };
      break;
    case 7:
      conf = {
        profitMargin: 0.05,
        copToleranceForOverCharge: 0.02
      };
      break;
  }
  return conf;
};
