export enum Envs {
  BATCH_SIZE = "BATCH_SIZE",
  APP_NAME_MS = "APP_NAME_MS",
  API_KEY_MS = "API_KEY_MS",
  BASE_URL_MS = "BASE_URL_MS"
}

export const config = {
  batchSize: parseInt(process.env[Envs.BATCH_SIZE]!),
  baseUrl: process.env[Envs.BASE_URL_MS]!,
  apiKey: process.env[Envs.API_KEY_MS]!,
  appName: process.env[Envs.APP_NAME_MS]!
};
