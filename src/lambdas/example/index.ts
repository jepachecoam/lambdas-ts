// index.ts — Handler Layer
//
// Rules for this file:
//   - Entry point ONLY. No business logic whatsoever.
//   - Canonical order: log event → checkEnv() → new Model() → dto.extractParams()
//                      → model.process() → return 200 response
//   - Catch all errors and return a 500 response — NEVER throw out of the handler.
//   - Import order is managed by eslint-plugin-simple-import-sort (enforced on commit).

import httpResponse from "../../shared/responses/http";
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import { envs } from "./conf/envs";
import dto from "./dto";
import Model from "./model";
import { EnvsEnum } from "./types";

export const handler = async (event: any, _context: any) => {
  console.log("Event :>>>", JSON.stringify(event));

  try {
    // Fail fast if any required env var is missing.
    // Spread both lambda-specific vars and DB vars (remove dbEnv if no DB needed).
    checkEnv({ ...EnvsEnum, ...dbEnv });

    const model = new Model(envs.ENVIRONMENT);
    const params = dto.extractParams(event);
    const result = await model.process(params);

    console.log("Result =>>>", result);

    return httpResponse({ statusCode: 200, body: result });
  } catch (err) {
    console.error("Error in handler", err);
    return httpResponse({ statusCode: 500, body: err });
  }
};
