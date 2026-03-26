// Lambda-specific env var keys (NOT DB vars — those come from shared dbEnv)
export enum EnvsEnum {
  BASE_URL_MS = "BASE_URL_MS",
  API_KEY_MS = "API_KEY_MS",
  APP_NAME_MS = "APP_NAME_MS"
}

// Domain interfaces
export interface IProcessInput {
  idCarrier: number;
  idOrder: number;
  orderStatus: string;
  paymentMethod: string;
  agreementType: string;
  billingFactors: { [key: string]: number };
}

export interface ICarrierChargeBreakdownItem {
  original: number;
  charged: number;
  action: string;
}

export interface ICarrierChargeBreakdown {
  profitMargin: ICarrierChargeBreakdownItem;
  shippingRate: ICarrierChargeBreakdownItem;
  collectionFee: ICarrierChargeBreakdownItem;
  insuredValueReturn: ICarrierChargeBreakdownItem;
}

export interface IShippingRateBilled {
  total: number;
  breakdown: ICarrierChargeBreakdown;
}

export interface ICarrierChargeResponse {
  result: boolean;
  codeResponse: number;
  statusCodeName: string;
  message: string;
  data: IShippingRateBilled | null;
}

export interface IProcessResult {
  success: boolean;
  idOrder: number;
}
