import { EnvsEnum } from "../types";

export const envs = {
  BASE_URL_MS: process.env[EnvsEnum.BASE_URL_MS]!,
  API_KEY_MS: process.env[EnvsEnum.API_KEY_MS]!,
  APP_NAME_MS: process.env[EnvsEnum.APP_NAME_MS]!
};
