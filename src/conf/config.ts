import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { AwsEnv, BbEnv, ServerEnv } from "../shared/types";

const config = {
  server: {
    PORT: process.env[ServerEnv.PORT]
  },
  aws: {
    CLOUD_REGION: process.env[AwsEnv.CLOUD_REGION]
  },
  database: {
    DB_NAME_DEV: BbEnv.DB_HOST_DEV,
    DB_USER_DEV: BbEnv.DB_USER_DEV,
    DB_PASSWORD_DEV: BbEnv.DB_PASSWORD_DEV,
    DB_HOST_DEV: BbEnv.DB_HOST_DEV,
    DB_NAME_PROD: BbEnv.DB_HOST_PROD,
    DB_USER_PROD: BbEnv.DB_USER_PROD,
    DB_PASSWORD_PROD: BbEnv.DB_PASSWORD_PROD,
    DB_HOST_PROD: BbEnv.DB_HOST_PROD
  }
};

export default config;
