// types.ts — Type Definitions Layer
//
// Rules for this file:
//   - Interfaces, enums, Zod schemas, and constants ONLY.
//   - NO executable code (no functions, no class instantiation).
//   - EnvsEnum MUST list every env var this lambda needs (lambda-specific ones only).
//     DB vars come from shared `dbEnv`; they are NOT repeated here.
//   - Interface names: I + PascalCase  (e.g. IProcessInput)
//   - Enum names: PascalCase           (e.g. EnvsEnum)
//   - Enum values: SCREAMING_SNAKE_CASE

import { z } from "zod";

// ---------------------------------------------------------------------------
// Environment variable keys required by this lambda.
// Add every lambda-specific env var here and load them in conf/envs.ts.
// ---------------------------------------------------------------------------
export enum EnvsEnum {
  ENVIRONMENT = "ENVIRONMENT"
  // Add more keys as needed, e.g.:
  // BASE_URL_MS = "BASE_URL_MS",
  // API_KEY_MS  = "API_KEY_MS",
}

// ---------------------------------------------------------------------------
// Zod schema — validates the incoming event payload.
// Use schema.safeParse() in dto.ts for graceful validation.
// ---------------------------------------------------------------------------
export const inputSchema = z.object({
  idOrder: z.number().int().positive(),
  someField: z.string().min(1)
});

// Infer the TypeScript type from the Zod schema (preferred over duplicating the type).
export type IInputSchema = z.infer<typeof inputSchema>;

// ---------------------------------------------------------------------------
// Domain interfaces — shapes returned by DAO / used by Model.
// ---------------------------------------------------------------------------
export interface IProcessInput {
  idOrder: number;
  someField: string;
}

export interface IProcessResult {
  success: boolean;
  message: string;
}
