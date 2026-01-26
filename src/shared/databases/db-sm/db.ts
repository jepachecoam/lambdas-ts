import SecretManager from "../../../shared/services/secretManager";
import { dbEnvSm } from "../../types/database";
import Database from "./sequelize-sm";

interface DbConfig {
  environment?: string;
  customSecretName?: any;
}

const db = async (config: DbConfig) => {
  let secret: any;

  if (config.customSecretName) {
    secret = config.customSecretName;
  } else {
    if (
      !config.environment ||
      !["dev", "qa", "prod"].includes(config.environment)
    ) {
      throw new Error(`Invalid environment ${config.environment}`);
    }

    let secret: string;
    switch (config.environment) {
      case "prod":
        secret = process.env[dbEnvSm.DB_SECRET_PROD]!;
        break;
      case "qa":
        secret = process.env[dbEnvSm.DB_SECRET_QA]!;
        break;
      case "dev":
        secret = process.env[dbEnvSm.DB_SECRET_DEV]!;
        break;
      default:
        throw new Error(`Invalid environment ${config.environment}`);
    }
  }

  const SM = new SecretManager(process.env[dbEnvSm.DB_SECRET_REGION]!);
  const secretData = await SM.getSecrets(secret);

  const requiredProps = ["dbname", "host", "password", "username"];
  for (const prop of requiredProps) {
    if (!secretData[prop]) {
      throw new Error(`Missing required database property: ${prop}`);
    }
  }

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
