import http from "../../shared/http";
export const handler = async (
  event: unknown,
  _context: unknown
): Promise<any> => {
  console.log("Event =>>>", event);

  return http.jsonResponse({
    statusCode: 200,
    message: "hello word from lambda",
    result: {}
  });
};
