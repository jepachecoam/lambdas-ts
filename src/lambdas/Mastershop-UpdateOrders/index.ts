import { checkEnv } from "../../shared/validation/envChecker";
import Model from "./model";
import { Envs } from "./types";
import utils from "./utils";

export const handler = async (event: any, context: any) => {
  try {
    console.log("Event :>>>", JSON.stringify(event));

    checkEnv({ ...Envs });

    const model = new Model(process.env["ENVIRONMENT"]!);

    const { records, logStreamId } = model.parseEventParams({ event, context });

    await model.processRecordsWithRetries({
      recordsToProcess: records,
      attempts: 3,
      logStreamId
    });

    return utils.response({ statusCode: 200, body: "OK" });
  } catch (err) {
    console.error("Error processing records", err);
    return utils.response({ statusCode: 500, body: err });
  }
};
