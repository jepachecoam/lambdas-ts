import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { contextEnv, EnvironmentTypes } from "../types";

class Dynamo {
  private client: DynamoDBDocumentClient;
  private environment: EnvironmentTypes;

  private useEnvSuffix: boolean;

  constructor(environment: EnvironmentTypes, useEnvSuffix: boolean) {
    this.environment = environment;
    const dynamoClient = new DynamoDBClient({
      region: `${process.env[contextEnv.CLOUD_REGION]}`
    });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.useEnvSuffix = useEnvSuffix;
  }

  private getTableName(tableName: string): string {
    if (!this.useEnvSuffix) return tableName;

    return this.environment === "dev" ? `${tableName}-Dev` : tableName;
  }

  async getItem(tableName: string, key: Record<string, any>) {
    const params = new GetItemCommand({
      TableName: this.getTableName(tableName),
      Key: marshall(key)
    });
    const data = await this.client.send(params);
    return data.Item ? unmarshall(data.Item) : null;
  }

  async putItem(tableName: string, item: Record<string, any>) {
    const params = new PutItemCommand({
      TableName: this.getTableName(tableName),
      Item: marshall(item)
    });
    await this.client.send(params);
  }

  async deleteItem(tableName: string, key: Record<string, any>) {
    const params = new DeleteItemCommand({
      TableName: this.getTableName(tableName),
      Key: marshall(key)
    });
    await this.client.send(params);
  }
}

export default Dynamo;
