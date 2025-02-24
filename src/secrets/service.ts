import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { ValidationResult } from "src/shared/types";

class SecretsManagerService {
  private client: SecretsManagerClient;

  public constructor() {
    this.client = new SecretsManagerClient({});
  }

  async getSecrets<T extends object>(
    secretId: string,
    validator: (data: T) => ValidationResult,
  ): Promise<T> {
    const response = await this.client.send(
      new GetSecretValueCommand({
        SecretId: secretId,
      }),
    );

    if (response.$metadata.httpStatusCode != 200 || !response.SecretString)
      throw new Error(`error getting secrets`);

    const parsedData = JSON.parse(response.SecretString);

    const validationResult = validator(parsedData);
    if (!validationResult.isValid) {
      throw new Error(
        `Secret validation failed: ${validationResult.errors.join(", ")}`,
      );
    }

    return parsedData;
  }
}

export { SecretsManagerService };
