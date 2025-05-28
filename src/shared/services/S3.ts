import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { contextEnv } from "../types";

class S3 {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env[contextEnv.CLOUD_REGION]
    });
  }

  async getStream(Bucket: string, Key: string) {
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await this.client.send(command);
    const s3Stream: any = response.Body;
    if (!s3Stream) {
      throw new Error("No se pudo obtener el stream del archivo");
    }
    return s3Stream;
  }
}
export default S3;
