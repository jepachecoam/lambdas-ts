export interface getStatisticsInt {
  minOrdersRequired: number;
}

export interface OriginAndDestinationStat {
  idCarrier: string;
  paymentMethod: "cod" | "pia";
  originCityName: string;
  originCityDaneCode: string;
  shippingCityName: string;
  shippingCityDaneCode: string;
  avgHourDiff: number;
  totalOrders: number;
}

export interface ReturnStatisticsByStates {
  idCarrier: string;
  shippingStateName: string;
  paymentMethodGroup: "cod" | "pia";
  totalOrders: number;
  totalOrdersReturned: number;
  returnPercentage: number;
}

export interface ReturnStatisticsByCities {
  idCarrier: string;
  cityName: string;
  shippingCityDaneCode: string;
  paymentMethodGroup: "cod" | "pia";
  totalOrders: number;
  totalOrdersReturned: number;
  returnPercentage: number;
}
export enum statisticCategories {
  ORIGIN_AND_DESTINATION_AVG_HOUR_DIFF = "ORIGIN_AND_DESTINATION_AVG_HOUR_DIFF",
  STATES_RETURN_STATISTICS = "STATES_RETURN_STATISTICS",
  CITIES_RETURN_STATISTICS = "CITIES_RETURN_STATISTICS"
}
