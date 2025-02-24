import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

class DynamoDB {
  private static instance?: DynamoDBDocumentClient;

  private constructor() {}

  public static async getInstance(): Promise<DynamoDBDocumentClient> {
    if (!DynamoDB.instance) {
      try {
        const client = new DynamoDBClient({});
        DynamoDB.instance = DynamoDBDocumentClient.from(client);
      } catch (err: unknown) {
        throw new Error(
          `Error connecting to the dynamo database; ${(err as Error).message}`,
        );
      }
    }
    return DynamoDB.instance;
  }
}

export { DynamoDB };
