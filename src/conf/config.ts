import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const serverConf = {
  server: {
    PORT: process.env["PORT"]
  },
  redis: {
    HOST: process.env["REDIS_HOST"],
    PORT: process.env["REDIS_PORT"]
  }
};

export default serverConf;
