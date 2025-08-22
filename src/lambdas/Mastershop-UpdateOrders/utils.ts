import Ajv from "ajv";
import axios from "axios";

const isValidJSONObject = (data: any) => {
  const ajv = new Ajv({ strict: false, allowUnionTypes: true });

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const validate = ajv.compile({ type: "object" });
  return validate(data);
};

export const validateAndSanitizeJSON = (input: any) => {
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

const recordSchema = {
  type: "object",
  properties: {
    carrierData: {
      anyOf: [{ type: "object" }, { type: "null" }, { type: "string" }]
    },
    carrierName: { type: "string" },
    trackingNumber: {
      type: "string",
      pattern: "^[0-9]+$"
    },
    status: {
      type: "object",
      properties: {
        statusCode: {
          type: "string",
          pattern: "^[0-9]+$"
        },
        statusName: {
          anyOf: [{ type: "string" }, { type: "null" }]
        }
      },
      required: ["statusCode", "statusName"]
    },
    novelty: {
      type: "object",
      properties: {
        noveltyCode: {
          anyOf: [{ type: "string", pattern: "^[0-9]+$" }, { type: "null" }]
        }
      },
      required: ["noveltyCode"]
    },
    returnProcess: {
      type: "object",
      properties: {
        returnTrackingNumber: {
          anyOf: [{ type: "string", pattern: "^[0-9]+$" }, { type: "null" }]
        }
      },
      required: ["returnTrackingNumber"]
    }
  },
  required: [
    "carrierData",
    "carrierName",
    "trackingNumber",
    "status",
    "novelty",
    "returnProcess"
  ],
  additionalProperties: false
};

const validateRecordSchema = (data: any) => {
  const ajv = new Ajv({ strict: false, allowUnionTypes: true });
  const validate = ajv.compile(recordSchema);
  return validate(data);
};

export default {
  addDelay,
  httpRequest,
  response,
  validateRecordSchema,
  validateAndSanitizeJSON
};
