import http from "../../shared/http";
import dao from "./dao";
export const handler = async (
  event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    return http.jsonResponse({
      statusCode: 200,
      message: "hello word from lambda",
      result: await dao.getOrders(event)
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
