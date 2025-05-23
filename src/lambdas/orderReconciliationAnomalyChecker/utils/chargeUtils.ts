const ChargeStatus = {
  MATCHED: 1,
  ORDER_NOT_FOUND: 2,
  OVERCHARGED_ORDER: 7,
  UNDERCHARGED_ORDER: 8,
  ACCEPTABLE_WITHIN_TOLERANCE: 11,
  UNKNOWN: 12,
  PROFIT_MARGIN_NOT_FOUND: 13
};

const constants = {
  copToleranceForOverCharge: 700
};

export default { ChargeStatus, constants };
