import axios from "axios";

import { envs } from "../conf/envs";

export const b2bClientMs = axios.create({
  headers: {
    "x-api-key": envs.API_KEY_MS,
    "x-app-name": envs.APP_NAME_MS
  },
  baseURL: envs.URL_MS
});

export const b2bClientCarriers = axios.create({
  headers: {
    "x-api-key": envs.API_KEY_MS,
    "x-app-name": envs.APP_NAME_MS
  },
  baseURL: envs.URL_CARRIERS
});
