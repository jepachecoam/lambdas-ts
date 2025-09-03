import axios from "axios";

import { objectSchema, recordSchema } from "./types";

const validateRecordSchema = (data: any) => {
  return recordSchema.safeParse(data).success;
};

export const validateAndSanitizeJSON = (input: any) => {
  const isValidJSONObject = (data: any) => {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return false;
    }

    return objectSchema.safeParse(data).success;
  };
  let data = JSON.stringify({
    error: "The original input contained errors"
  });

  try {
    if (typeof input === "object" && input !== null) {
      if (isValidJSONObject(input)) {
        data = JSON.stringify(input);
      } else {
        console.error("Invalid object structure:", input);
      }
    } else if (typeof input === "string") {
      const parsedData = JSON.parse(input);
      if (isValidJSONObject(parsedData)) {
        data = JSON.stringify(parsedData);
      } else {
        console.error("Invalid JSON object structure:", input);
      }
    } else {
      console.error("Invalid data type for carrierData:", input);
    }
  } catch (error: any) {
    console.error("Error parsing carrierData:", error.message);
    console.error("Invalid data received:", input);
  }

  return data;
};

const addDelay = (seconds: any) => {
  console.log(`Delaying for ${seconds} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const httpRequest = async ({ method, url, data = null, config = {} }: any) => {
  try {
    const response = await axios({ method, url, data, ...config });

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    console.warn(`Unexpected HTTP status: ${response.status}`);
    console.warn("Response body:", response.data);

    return null;
  } catch (error: any) {
    if (error.response) {
      console.error(
        `HTTP Error: ${error.response.status} - ${error.response.statusText}`
      );
      console.error("Response body:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Request setup error:", error.message);
    }
    return null;
  }
};

const response = ({ statusCode, body }: any) => ({
  statusCode,
  body: JSON.stringify(body)
});

export default {
  addDelay,
  httpRequest,
  response,
  validateRecordSchema,
  validateAndSanitizeJSON
};
