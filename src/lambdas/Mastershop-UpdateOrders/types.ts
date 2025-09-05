import { z } from "zod";

export enum Envs {
  BASE_URL_MS = "BASE_URL_MS",
  ENVIRONMENT = "ENVIRONMENT",
  URL_WEBHOOK_ERROR_CRITICAL_SERVICES = "URL_WEBHOOK_ERROR_CRITICAL_SERVICES",
  URL_WEBHOOK_ERROR_LOGS = "URL_WEBHOOK_ERROR_LOGS",
  API_KEY_MS = "API_KEY_MS",
  APP_NAME_MS = "APP_NAME_MS"
}

export enum Carriers {
  COORDINADORA = "COORDINADORA",
  TCC = "TCC",
  SWAYP = "SWAYP",
  ENVIA = "ENVIA",
  INTERRAPIDISIMO = "INTERRAPIDISIMO"
}

export enum OrderSources {
  Order = "order",
  OrderLeg = "orderLeg",
  OrderReturn = "orderReturn",
  OrderReturnLeg = "orderReturnLeg"
}

export interface IRecordData {
  idUser: number;
  idBusiness: number;
  idOrder: number;
  idOrderReturn?: number;
  source: "orderLeg" | "order" | "orderReturnLeg" | "orderReturn";
  carrierTrackingCode: string;
}

export const recordSchema = z.object({
  idCarrier: z.number().optional(),
  carrierData: z.any(),
  carrierName: z.string(),
  trackingNumber: z.string().regex(/^[0-9]+$/),
  status: z.object({
    statusCode: z.string().regex(/^[0-9]+$/),
    statusName: z.string().nullable()
  }),
  novelty: z.object({
    noveltyCode: z
      .string()
      .regex(/^[0-9]+$/)
      .nullable()
  }),
  returnProcess: z.object({
    returnTrackingNumber: z
      .string()
      .regex(/^[0-9]+$/)
      .nullable()
  }),
  linkedShipment: z
    .object({
      linkedCarrierTrackingCode: z
        .string()
        .regex(/^[0-9]+$/)
        .nullable()
        .optional(),
      shippingRate: z.number().nullable().optional(),
      originAddress: z.any().nullable().optional(),
      shippingAddress: z.any().nullable().optional(),
      legReason: z.string().nullable().optional()
    })
    .optional(),
  updateSource: z.string().optional().nullable()
});

export const objectSchema = z.object({});

export type IRecord = z.infer<typeof recordSchema>;
