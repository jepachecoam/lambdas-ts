import { z } from "zod";

export const EventSchema = z.object({
  data: z.any()
});

export type IPayload = z.infer<typeof EventSchema>;
