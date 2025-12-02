import SecretManager from "../../../shared/services/secretManager";
import { dbEnvSm } from "../../types/database";
import Database from "./sequelize-sm";

const db = async (environment: string) => {
  if (!["dev", "qa", "prod"].includes(environment)) {
    throw new Error(`Invalid environment ${environment}`);
  }

  let secret: any = "";

  switch (environment) {
    case "prod":
      secret = process.env[dbEnvSm.DB_SECRET_PROD]!;
      break;
    case "qa":
      secret = process.env[dbEnvSm.DB_SECRET_QA]!;
      break;
    case "dev":
      secret = process.env[dbEnvSm.DB_SECRET_DEV]!;
      break;
  }

  const SM = new SecretManager(process.env[dbEnvSm.DB_SECRET_REGION]!);

  const secretData = await SM.getSecrets(secret);

  const db = new Database({
    database: secretData.dbname,
    host: secretData.host,
    hostReadOnly: secretData.hostReadOnly,
    password: secretData.password,
    username: secretData.username
  });

  return db;
};

export default db;
