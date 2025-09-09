import { EnvsEnum } from "../types";

export const envs = {
  API_KEY_MS: process.env[EnvsEnum.API_KEY_MS]!,
  APP_NAME_MS: process.env[EnvsEnum.APP_NAME_MS]!,
  URL_MS: process.env[EnvsEnum.URL_MS]!,
  URL_CARRIERS: process.env[EnvsEnum.URL_CARRIERS]!,
  tcc: {
    ACCESS_TOKEN_TCC: process.env[EnvsEnum.ACCESS_TOKEN_TCC]!,
    URL_API_NOVEDADES_TCC: process.env[EnvsEnum.URL_API_NOVEDADES_TCC]!
  }
};
