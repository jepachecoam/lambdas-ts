import httpResponse from "../../shared/responses/http";
import Dto from "./dto";
import Model from "./model";

export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    const { imageUrl, name, category, description } = event;

    // Validate all parameters in one place
    const validation = Dto.validateAllParameters({
      imageUrl,
      name,
      category,
      description
    });
    if (!validation.isValid) {
      return httpResponse({
        statusCode: 400,
        body: {
          error: validation.error
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
