import httpResponse from "../../shared/responses/http";
import dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    const { environment } = dto.getParams(event);

    const model = new Model(environment);

    const result = await model.processBatchDeduplication();

    return httpResponse({
      statusCode: 200,
      body: {
        message: "Batch deduplication completed",
        data: result
      }
    });
  } catch (error: any) {
    console.error("ErrorLog :>>>", error);
    return httpResponse({
      statusCode: 500,
      body: {
        message: error.message || "Internal server error",
        data: null
      }
    });
  }
};
