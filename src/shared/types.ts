export type EnvironmentTypes = "dev" | "prod" | "qa";

export enum dbEnv {
  DB_NAME_DEV = "DB_NAME_DEV",
  DB_USER_DEV = "DB_USER_DEV",
  DB_PASSWORD_DEV = "DB_PASSWORD_DEV",
  DB_HOST_DEV = "DB_HOST_DEV",

  DB_NAME_PROD = "DB_NAME_PROD",
  DB_USER_PROD = "DB_USER_PROD",
  DB_PASSWORD_PROD = "DB_PASSWORD_PROD",
  DB_HOST_PROD = "DB_HOST_PROD"
}

export enum dynamoEnv {
  AWS_REGION = "AWS_REGION"
}
