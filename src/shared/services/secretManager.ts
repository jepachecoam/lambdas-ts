import {
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";

class SecretManager {
  private client: SecretsManagerClient;

  constructor(region: string) {
    this.client = new SecretsManagerClient({
      region: region
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
