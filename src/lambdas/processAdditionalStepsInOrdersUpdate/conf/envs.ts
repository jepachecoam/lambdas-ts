import { EnvsEnum } from "../types";

export const envs = {
  API_KEY_MS: process.env[EnvsEnum.API_KEY_MS]!,
  APP_NAME_MS: process.env[EnvsEnum.APP_NAME_MS]!,
  URL_API_SEND_EVENT: process.env[EnvsEnum.URL_API_SEND_EVENT]!,
  URL_MS: process.env[EnvsEnum.URL_MS]!,
  tcc: {
    ACCESS_TOKEN_TCC: process.env[EnvsEnum.ACCESS_TOKEN_TCC]!
  }
};
