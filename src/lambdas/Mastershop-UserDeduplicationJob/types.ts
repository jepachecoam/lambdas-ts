export enum envs {
  CT_DB_SECRET = "CT_DB_SECRET",
  MS_DB_SECRET = "MS_DB_SECRET"
}

export const config = {
  CT_DB_SECRET: process.env[envs.CT_DB_SECRET],
  MS_DB_SECRET: process.env[envs.MS_DB_SECRET]
};
