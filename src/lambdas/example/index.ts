import http from "../../shared/http";
import { checkEnv } from "./utils";
export const handler = async (
  event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    checkEnv();
    console.log("Event =>>>", event);

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
