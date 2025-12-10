import { z } from "zod";

export const LocationSchema = z.object({
  countryState: z.string().min(1, "Department is required"),
  countryCity: z.string().min(1, "City is required")
});

export const PayloadSchema = z.object({
  idBusiness: z
    .number()
    .int()
    .positive("idBusiness must be a positive integer"),
  origin: LocationSchema,
  destination: LocationSchema,
  idUserCarrierPreference: z
    .number()
    .int()
    .positive("idUserCarrierPreference must be a positive integer")
});

export type ILocation = z.infer<typeof LocationSchema>;
export type IPayload = z.infer<typeof PayloadSchema>;

export interface IValidateCoverageResponse {
  success: boolean;
  message: string;
}
