import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import { envs } from "./conf/envs";
import Model from "./model";
import { EnvsEnum } from "./types";
import utils from "./utils";

export const handler = async (event: any, context: any) => {
  try {
    console.log("Event :>>>", JSON.stringify(event));

    checkEnv({ ...EnvsEnum, ...dbEnv });

    const model = new Model(envs.ENVIRONMENT);

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
