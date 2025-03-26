import { checkEnv } from "../../shared/envChecker";
import http from "../../shared/http";
import { EnvVariables } from "./types";

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    checkEnv(EnvVariables);

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
