import { z } from "zod";

const SenderRecipientSchema = z.object({
  fullName: z.string(),
  phone: z.string().nullable(),
  city: z.string(),
  address: z.string()
});

export const ShippingLabelDataSchema = z.object({
  format: z.enum(["standar", "sticker"]),
  carrierTrackingCode: z.string(),
  date: z.string(),
  from: SenderRecipientSchema,
  to: SenderRecipientSchema,
  description: z.string(),
  amount: z.number()
});

export type ShippingLabelData = z.infer<typeof ShippingLabelDataSchema>;

export enum Envs {
  URL_CDN = "URL_CDN"
}
