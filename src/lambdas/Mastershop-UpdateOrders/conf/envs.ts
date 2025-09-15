import { EnvsEnum } from "../types";

export const envs = {
  API_KEY_MS: process.env[EnvsEnum.API_KEY_MS]!,
  APP_NAME_MS: process.env[EnvsEnum.APP_NAME_MS]!,
  BASE_URL_MS: process.env[EnvsEnum.BASE_URL_MS]!,
  URL_WEBHOOK_ERROR_LOGS: process.env[EnvsEnum.URL_WEBHOOK_ERROR_LOGS]!,
  ENVIRONMENT: process.env[EnvsEnum.ENVIRONMENT]!
};
