import axios from "axios";
import { z } from "zod";

const isValidJSONObject = (data: any) => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  const schema = z.object({});
  return schema.safeParse(data).success;
};

const validateRecordSchema = (data: any) => {
  const recordSchema = z.object({
    carrierData: z.any(),
    carrierName: z.string(),
    trackingNumber: z.string().regex(/^[0-9]+$/),
    status: z.object({
      statusCode: z.string().regex(/^[0-9]+$/),
      statusName: z.union([z.string(), z.null()])
    }),
    novelty: z.object({
      noveltyCode: z.union([z.string().regex(/^[0-9]+$/), z.null()])
    }),
    returnProcess: z.object({
      returnTrackingNumber: z.union([z.string().regex(/^[0-9]+$/), z.null()])
    }),
    linkedShipment: z.object({
      linkedCarrierTrackingCode: z.union([
        z.string().regex(/^[0-9]+$/),
        z.null()
      ])
    })
  });

  return recordSchema.safeParse(data).success;
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

export default {
  addDelay,
  httpRequest,
  response,
  validateRecordSchema,
  validateAndSanitizeJSON
};
