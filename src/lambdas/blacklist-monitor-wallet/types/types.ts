export enum EnvVariables {
  DB_NAME_DEV = "DB_NAME_DEV",
  DB_USER_DEV = "DB_USER_DEV",
  DB_PASSWORD_DEV = "DB_PASSWORD_DEV",
  DB_HOST_DEV = "DB_HOST_DEV",

  DB_NAME_PROD = "DB_NAME_PROD",
  DB_USER_PROD = "DB_USER_PROD",
  DB_PASSWORD_PROD = "DB_PASSWORD_PROD",
  DB_HOST_PROD = "DB_HOST_PROD"
}

export interface AddItemToBlacklistParams {
  idBlacklistEntityType: number;
  idEntity: string | number;
  idReference: string | number;
  idBlacklistReason: number;
}

export interface UpdateItemToBlacklistParams {
  idBlacklist: string | number;
  newStatus: string;
}

export enum statusType {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}
