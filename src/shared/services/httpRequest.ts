import axios from "axios";

export const b2bRequest = axios.create({
  baseURL: process.env["B2B_BASE_URL"],
  headers: {
    "x-api-key": process.env["API_KEY_MS"],
    "x-app-name": process.env["APP_NAME_MS"]
  }
});
