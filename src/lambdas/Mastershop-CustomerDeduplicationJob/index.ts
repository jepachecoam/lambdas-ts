import httpResponse from "../../shared/responses/http";
import { b2bRequestEnvs } from "../../shared/types/b2b-request";
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    const envs = checkEnv({
      ...b2bRequestEnvs,
      ...dbEnv
    });

    const { environment } = dto.getParams(event);

    const model = new Model(environment, envs);

    await model.processBatchDeduplication();

    return httpResponse({
      statusCode: 200,
      body: {
        message: "Success process"
      }
    });
  } catch (error: any) {
    console.error("ErrorLog :>>>", error);
    return httpResponse({
      statusCode: 500,
      body: {
        message: "Internal server error",
        data: null
      }
    });
  }
};
