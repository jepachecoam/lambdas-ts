import httpResponse from "../../shared/responses/http";
import Model from "./model";

export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    const { imageUrl, name, category, description } = event;

    if (!imageUrl || !name || !category || !description) {
      return httpResponse({
        statusCode: 400,
        body: {
          error: "imageUrl, name, category, and description are required"
        }
      });
    }

    const model = new Model();

    const approvalResponse = await model.processProductApproval({
      imageUrl,
      name,
      category,
      description
    });

    return httpResponse({
      statusCode: 200,
      body: approvalResponse
    });
  } catch (error: any) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: { message: "Internal server Error" }
    });
  }
};
