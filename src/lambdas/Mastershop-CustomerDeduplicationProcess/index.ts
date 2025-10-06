import httpResponse from "../../shared/responses/http";
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";

const ENVIRONMENT = "qa";

export const handler = async (event: any) => {
  try {
    console.log("Event received:", JSON.stringify(event));

    const envs = checkEnv({
      ...dbEnv,
      ENVIRONMENT: "ENVIRONMENT"
    });

    const records = dto.getRecords(event);
    const model = new Model(ENVIRONMENT, envs);

    await model.processRecords(records);

    return httpResponse({
      statusCode: 200,
      body: { message: "Process completed successfully" }
    });
  } catch (error) {
    console.error("Process failed:", error);
    return httpResponse({
      statusCode: 500,
      body: {
        message: "Internal server error",
        data: null
      }
    });
  }
};
