import Dynamo from "../../shared/services/dynamo";
import SecretManager from "../../shared/services/secretManager";
import { EnvironmentTypes } from "../../shared/types";

class Dao {
  private secretManager: SecretManager;
  private dynamo: Dynamo;
  constructor(environment: EnvironmentTypes) {
    this.secretManager = new SecretManager(environment, false);
    this.dynamo = new Dynamo(environment, true);
  }

  async getSecret(secretName: string) {
    return this.secretManager.getSecrets(secretName);
  }

  async getItem(tableName: string, key: Record<string, any>) {
    return this.dynamo.getItem(tableName, key);
  }
}

export default Dao;
