const PaymentStatus = {
  MATCHED: 1,
  ORDER_NOT_FOUND: 2,
  OVERCHARGED_ORDER: 7,
  UNDERCHARGED_ORDER: 8,
  ACCEPTABLE_WITHIN_TOLERANCE: 11,
  UNKNOWN: 12
};

const constants = {
  copToleranceForDifference: 100
};

export default { PaymentStatus, constants };
