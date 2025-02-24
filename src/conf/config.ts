import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const serverConf = {
  server: {
    PORT: process.env["PORT"] || 3000
  }
};

export default serverConf;
