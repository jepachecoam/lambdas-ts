import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

class S3 {
  private client: S3Client;

  constructor(region: string) {
    this.client = new S3Client({
      region: region
    });
  }

  async getStream(Bucket: string, Key: string, isOmitted?: boolean) {
    try {
      const command = new GetObjectCommand({ Bucket, Key });
      const response = await this.client.send(command);
      const s3Stream: any = response.Body;
      if (!s3Stream) {
        throw new Error("No se pudo obtener el stream del archivo");
      }
      return s3Stream;
    } catch (error: any) {
      if (error.Code === "NoSuchKey" && isOmitted) {
        return null;
      }
      throw error;
    }
  }

  async putObject(Bucket: string, Key: string, Body: any) {
    const command = new PutObjectCommand({
      Bucket,
      Key,
      Body
    });
    return await this.client.send(command);
  }
}
export default S3;
