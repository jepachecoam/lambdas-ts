import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

import { contextEnv } from "../types";

class SQS {
  private client = new SQSClient({
    region: process.env[contextEnv.CLOUD_REGION]
  });

  async sendMessage(QueueUrl: string, messageBody: any) {
    const command = new SendMessageCommand({
      QueueUrl,
      MessageBody: JSON.stringify(messageBody)
    });

    return this.client.send(command);
  }
}

export default SQS;
