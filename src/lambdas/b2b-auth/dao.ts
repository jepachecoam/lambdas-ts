import Dynamo from "../../shared/databases/dynamo";
import SecretManager from "../../shared/services/secretManager";
import { EnvironmentTypes } from "../../shared/types";

class Dao {
  private secretManager: SecretManager;
  private dynamo: Dynamo;
  private environment: EnvironmentTypes;
  constructor(environment: EnvironmentTypes) {
    this.secretManager = new SecretManager();
    this.dynamo = new Dynamo();
    this.environment = environment;
  }

  async getSecret(secretName: string) {
    return this.secretManager.getSecrets(secretName);
  }

  async getItem(tableName: string, key: Record<string, any>) {
    if (this.environment === "dev") {
      tableName = `${tableName}-Dev`; // revisar este cambio
    }
    return this.dynamo.getItem(tableName, key);
  }
}

export default Dao;
