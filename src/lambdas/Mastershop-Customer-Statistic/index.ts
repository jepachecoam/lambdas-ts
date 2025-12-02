import httpResponse from "../../shared/responses/http";
import { b2bRequestEnvs } from "../../shared/types/b2b-request";
import { redisEnv } from "../../shared/types/redis";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    checkEnv({
      ...b2bRequestEnvs,
      ...redisEnv
    });

    const { environment, phone } = dto.getParams(event);

    const model = new Model(environment);
    await model.preloadCache(phone);

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
