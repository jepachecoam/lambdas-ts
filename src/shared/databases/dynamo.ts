import AWS from "aws-sdk";

import { EnvironmentTypes } from "../types";
import AwsInstance from "./aws";

class Dynamo {
  private db: AWS.DynamoDB.DocumentClient;
  private environment: EnvironmentTypes;

  constructor(environment: EnvironmentTypes) {
    this.environment = environment;
    this.db = new AwsInstance.DynamoDB.DocumentClient();
  }

  private getTableName(tableName: string): string {
    return this.environment === "dev" ? `${tableName}-Dev` : tableName;
  }

  async getItem(tableName: string, key: any) {
    const params = {
      TableName: this.getTableName(tableName),
      Key: key
    };
    const data = await this.db.get(params).promise();
    console.log("Item retrieved:", data.Item);
    return data.Item;
  }

  async putItem(tableName: string, item: any) {
    const params = {
      TableName: this.getTableName(tableName),
      Item: item
    };
    await this.db.put(params).promise();
    console.log("Item inserted:", item);
  }

  async batchGetItems(tableName: string, keys: Array<any>) {
    const params = {
      RequestItems: {
        [this.getTableName(tableName)]: {
          Keys: keys
        }
      }
    };
    const data = await this.db.batchGet(params).promise();
    console.log(
      "Batch Get Items:",
      data.Responses?.[this.getTableName(tableName)]
    );
    return data.Responses?.[this.getTableName(tableName)];
  }

  async batchWriteItems(tableName: string, items: Array<any>) {
    const params = {
      RequestItems: {
        [this.getTableName(tableName)]: items.map((item) => ({
          PutRequest: { Item: item }
        }))
      }
    };
    const data = await this.db.batchWrite(params).promise();
    console.log("Batch Write Success:", data);
  }

  async updateItem(
    tableName: string,
    key: any,
    updateExpression: string,
    expressionAttributes: any
  ) {
    const params = {
      TableName: this.getTableName(tableName),
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributes,
      ReturnValues: "UPDATED_NEW"
    };
    const data = await this.db.update(params).promise();
    console.log("Item updated:", data, "newParams", params);
    return data;
  }

  async deleteItem(tableName: string, key: any) {
    const params = {
      TableName: this.getTableName(tableName),
      Key: key
    };
    await this.db.delete(params).promise();
    console.log("Item deleted:", key);
  }
}

export default Dynamo;
