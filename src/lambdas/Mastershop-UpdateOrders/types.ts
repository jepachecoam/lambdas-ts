import { z } from "zod";

export enum Envs {
  DB_HOST_READ_ONLY = "DB_HOST_READ_ONLY",
  DB_HOST = "DB_HOST",
  DB_USER = "DB_USER",
  DB_PASSWORD = "DB_PASSWORD",
  DB_NAME = "DB_NAME",
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
  OderLeg = "oderLeg",
  OrderReturn = "orderReturn",
  OrderReturnLeg = "orderReturnLeg"
}

export interface IRecordData {
  idUser: number;
  idBusiness: number;
  idOrder: number;
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
    statusName: z.union([z.string(), z.null()])
  }),
  novelty: z.object({
    noveltyCode: z.union([z.string().regex(/^[0-9]+$/), z.null()])
  }),
  returnProcess: z.object({
    returnTrackingNumber: z.union([z.string().regex(/^[0-9]+$/), z.null()])
  }),
  linkedShipment: z.object({
    linkedCarrierTrackingCode: z.union([z.string().regex(/^[0-9]+$/), z.null()])
  }),
  updateSource: z.string().optional().nullable()
});

export const objectSchema = z.object({});

export type IRecord = z.infer<typeof recordSchema>;
