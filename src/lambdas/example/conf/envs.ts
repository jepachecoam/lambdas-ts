// conf/envs.ts — Env Config Layer
//
// Rules for this file:
//   - Eagerly load every env var listed in EnvsEnum using process.env[EnvsEnum.KEY]!
//     (non-null assertion is intentional — checkEnv() in index.ts guarantees they exist).
//   - Export a single `envs` plain object.
//   - Never add logic here; this is pure configuration.

import { EnvsEnum } from "../types";

export const envs = {
  ENVIRONMENT: process.env[EnvsEnum.ENVIRONMENT]!
  // Add more as needed, matching EnvsEnum exactly:
  // BASE_URL_MS: process.env[EnvsEnum.BASE_URL_MS]!,
  // API_KEY_MS:  process.env[EnvsEnum.API_KEY_MS]!,
};
