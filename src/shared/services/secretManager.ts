import {
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";

import { contextEnv } from "../types";

class SecretManager {
  private client: SecretsManagerClient;

  constructor() {
    this.client = new SecretsManagerClient({
      region: `${process.env[contextEnv.CLOUD_REGION]}`
    });
  }

  async getSecrets(secretName: string) {
    try {
      const secret: any = await this.client.send(
        new GetSecretValueCommand({
          SecretId: secretName,
          VersionStage: "AWSCURRENT"
        })
      );
      return JSON.parse(secret.SecretString);
    } catch (error) {
      console.log("error lambda", error);
      throw new Error("Secrets has been not retrieved");
    }
  }
}

export default SecretManager;
