import { z } from "zod";

// Lambda-specific env var keys (NOT DB vars — those come from shared dbEnv)
export enum EnvsEnum {
  BASE_URL_MS = "BASE_URL_MS",
  API_KEY_MS = "API_KEY_MS",
  APP_NAME_MS = "APP_NAME_MS"
}

// Zod schema for validating the incoming EventBridge event
export const inputSchema = z.object({
  id_order: z.number().int().positive(),
  order_logistics: z.object({
    id_carrier: z.number().int().positive(),
    shipping_rate: z.number(),
    carrier_profit_margin: z.union([z.string(), z.number()])
  }),
  order_transaction: z.object({
    payment_method: z.string()
  }),
  carrierInfo: z.object({
    orderStatus: z.string(),
    agreementType: z.string(),
    collectionFee: z.number().optional().default(0),
    insuredValueReturn: z.number().optional().default(0)
  }),
  parameters: z.object({
    stage: z.string()
  })
});

export type IInputSchema = z.infer<typeof inputSchema>;

// Domain interfaces
export interface IProcessInput {
  idOrder: number;
  idCarrier: number;
  paymentMethod: string;
  shippingRate0: number;
  profitMargin: number;
  collectionFee: number;
  insuredValueReturn: number;
  orderStatus: string;
  agreementType: string;
  stage: string;
}

export interface ICarrierChargeBreakdownItem {
  original: number;
  charged: number;
  action: string;
}

export interface ICarrierChargeBreakdown {
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
