import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const serverConf = {
  server: {
    PORT: process.env["PORT"]
  },
  redis: {
    HOST: process.env["REDIS_HOST"],
    PORT: process.env["REDIS_PORT"]
  },
  s3: {
    URL_S3: process.env["URL_S3"],
    BUCKET_NAME: process.env["BUCKET_NAME"]
  }
};

export default serverConf;
