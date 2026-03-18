enum Constants {
  BEARER_PREFIX = "Bearer ",
  POLICY_VERSION = "2012-10-17",
  PRINCIPAL_ID = "user",
  ALLOW = "Allow",
  DENY = "Deny"
}

enum EnvsEnum {
  JWT_SECRET = "JWT_SECRET",
  REDIS_HOST = "REDIS_HOST",
  REDIS_PORT = "REDIS_PORT",
  REDIS_TTL_IN_MINUTES = "REDIS_TTL_IN_MINUTES",
  MS_API_URL = "MS_API_URL",
  MS_APP_NAME = "MS_APP_NAME",
  MS_API_KEY = "MS_API_KEY",
  DB_SECRET_PROD = "DB_SECRET_PROD",
  DB_SECRET_QA = "DB_SECRET_QA",
  DB_SECRET_DEV = "DB_SECRET_DEV",
  DB_SECRET_REGION = "DB_SECRET_REGION"
}

export interface IUserRecord {
  idUser: number;
  email: string;
  cognitoSub: string;
}

export default { Constants, EnvsEnum };
