import {
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";

import { contextEnv, EnvironmentTypes } from "../types";

class SecretManager {
  private client: SecretsManagerClient;
  private environment: EnvironmentTypes;

  private useEnvSuffix: boolean;

  constructor(environment: EnvironmentTypes, useEnvSuffix: boolean) {
    this.client = new SecretsManagerClient({
      region: `${process.env[contextEnv.CLOUD_REGION]}`
    });

    this.environment = environment;
    this.useEnvSuffix = useEnvSuffix;
  }

  private getSecretName(secretName: string): string {
    if (!this.useEnvSuffix) return secretName;

    return this.environment === "dev" ? `${secretName}-Dev` : secretName;
  }

  async getSecrets(secretName: string) {
    try {
      const secret: any = await this.client.send(
        new GetSecretValueCommand({
          SecretId: this.getSecretName(secretName),
          VersionStage: "AWSCURRENT"
        })
      );
      return JSON.parse(secret.SecretString);
    } catch (error) {
      // For a list of exceptions thrown, see
      // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
      console.log("error lambda", error);
      throw new Error("Secrets has been not retrieved");
    }
  }
}

export default SecretManager;
