import httpResponse from "../../shared/responses/http";
export const handler = async (
  event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    return httpResponse({
      statusCode: 200,
      body: "hello word from lambda"
    });
  } catch (error) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: error
    });
  }
};
