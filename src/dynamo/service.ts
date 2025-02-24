import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { DateTime } from "luxon";
import { GatewayEnum } from "src/shared/enums";

class DynamoGatewayBalanceService {
  private documentClient: DynamoDBDocumentClient;
  private table: string;

  public constructor(documentClient: DynamoDBDocumentClient, table: string) {
    this.documentClient = documentClient;
    this.table = table;
  }

  public async getBalanceByGateway(gateway: GatewayEnum): Promise<number> {
    try {
      const command = new GetCommand({
        TableName: this.table,
        Key: { gateway },
      });

      const result = await this.documentClient.send(command);
      if (!result.Item) throw new Error("Gateway balance don't exist");

      return result.Item.balance;
    } catch (err: unknown) {
      throw new Error(
        `Error fetching from DynamoDB; table: ${this.table}; ${(err as Error).message}`,
      );
    }
  }

  public async updateBalanceByGateway(
    gateway: GatewayEnum,
    balance: number,
  ): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.table,
        Item: {
          gateway,
          balance,
          updatedAt: DateTime.now().toISO(),
        },
      });

      await this.documentClient.send(command);
    } catch (err: unknown) {
      throw new Error(
        `Error saving on dynamoDB; table: ${this.table}; ${(err as Error).message}`,
      );
    }
  }
}

export { DynamoGatewayBalanceService };
