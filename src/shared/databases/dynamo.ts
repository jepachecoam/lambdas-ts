import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

class Dynamo {
  private client: DynamoDBDocumentClient;

  constructor(region: string) {
    const dynamoClient = new DynamoDBClient({
      region: region
    });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
  }

  async getItem(tableName: string, key: Record<string, any>) {
    const params = new GetItemCommand({
      TableName: tableName,
      Key: marshall(key)
    });
    const data = await this.client.send(params);
    return data.Item ? unmarshall(data.Item) : null;
  }

  async putItem(tableName: string, item: Record<string, any>) {
    const params = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item)
    });
    await this.client.send(params);
  }

  async deleteItem(tableName: string, key: Record<string, any>) {
    const params = new DeleteItemCommand({
      TableName: tableName,
      Key: marshall(key)
    });
    await this.client.send(params);
  }
}

export default Dynamo;
