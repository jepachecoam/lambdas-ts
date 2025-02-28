import http from "../../shared/http";
import dao from "./dao";
import { checkEnv } from "./utils";
import { validateOrderTableFilters } from "./validations";
export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    checkEnv();
    console.log("Event =>>>", event);

    const { error, value } = validateOrderTableFilters(event);
    if (error) {
      return http.jsonResponse({
        statusCode: 400,
        message: error.message,
        result: {}
      });
    }
    return http.jsonResponse({
      statusCode: 200,
      message: "hello word from lambda",
      result: await dao.getOrders(value)
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
