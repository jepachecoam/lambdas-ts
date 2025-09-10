import z from "zod";

export enum CarrierCodes {
  CerradoPorIncidencia = "8"
}

export const recordSchema = z.object({
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
  linkedShipment: z.object({
    linkedCarrierTrackingCode: z
      .string()
      .regex(/^[0-9]+$/)
      .nullable()
  }),
  source: z.string().optional().nullable(),
  updateSource: z.string().optional().nullable()
});

export type IRecord = z.infer<typeof recordSchema>;
