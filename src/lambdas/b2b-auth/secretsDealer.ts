import {
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";

async function matchSecret(apiKey: any, appName: any) {
  const secrets = await getSecrets();
  const apiKeySaved = secrets[appName];

  console.log("match", { apiKeySaved, apiKey }, apiKey === apiKeySaved);

  return apiKey === apiKeySaved;
}

async function getSecrets() {
  const secretName = "apigateway/prod/apps/b2b-api-keys";

  const client = new SecretsManagerClient({
    region: "us-east-1"
  });

  try {
    const secret: any = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
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

export { matchSecret };
