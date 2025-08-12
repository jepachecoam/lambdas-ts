import httpResponse from "../../shared/responses/http";
import Dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  console.log("Event >>>", JSON.stringify(event, null, 2));

  try {
    const params = Dto.getParams(event);
    const model = new Model();
    const result = await model.processRequest(params);

    // Determine HTTP status code based on result
    let statusCode = 200;
    if (
      result.message === "department is missing" ||
      result.message === "city is missing"
    ) {
      statusCode = 404;
    } else if (result.message === "internal error") {
      statusCode = 500;
    }

    return httpResponse({
      statusCode,
      body: result
    });
  } catch (error) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: {
        message: "internal server error",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });
  }
};
