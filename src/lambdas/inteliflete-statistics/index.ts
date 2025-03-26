import { checkEnv } from "../../shared/envChecker";
import http from "../../shared/http";
import { dbEnv, dynamoEnv } from "../../shared/types";
import Model from "./model";

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    checkEnv({ ...dynamoEnv, ...dbEnv });

    const environment = "prod";

    const model = new Model(environment);
    await model.updateStatistics();

    return http.jsonResponse({
      statusCode: 200,
      message: "hello word from lambda",
      result: {}
    });
  } catch (error) {
    console.error("Error:", error);
    return http.jsonResponse({
      statusCode: 500,
      message: "Internal server error",
      result: {}
    });
  }
};
