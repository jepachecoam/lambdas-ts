import { z } from "zod";

export const resolveIdCustomerSchema = z.object({
  idUser: z.number(),
  idBusiness: z.number(),
  externalId: z.string().nullable().optional(),
  fullName: z.string(),
  firstName: z.string(),
  lastName: z.string().nullable().optional(),
  tags: z.any().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z
    .object({
      state: z.string().optional(),
      city: z.string().optional()
    })
    .passthrough()
    .nullable()
    .optional(),
  documentType: z.string().nullable().optional(),
  document: z.string().nullable().optional()
});
