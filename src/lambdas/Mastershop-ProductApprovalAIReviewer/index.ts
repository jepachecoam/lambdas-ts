import Dto from "./dto";
import Model from "./model";

export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    console.log("Event =>>>", JSON.stringify(event));

    const { urlImageProduct: imageUrl, name, description } = event;

    const category = event.basicValidationResult?.category;

    const validation = Dto.validateAllParameters({
      imageUrl,
      name,
      category,
      description
    });
    if (!validation.isValid) {
      console.error("Validation error:", validation.error);
      return {
        statusCode: 400,
        error: validation.error
      };
    }

    const model = new Model();

    const approvalResponse = await model.processProductApproval({
      imageUrl,
      name,
      category,
      description
    });

    const result = {
      ...approvalResponse,
      statusCode: 200,
      origin: "ai"
    };
    console.log("result >>>", result);
    return result;
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      error: error.message || "Internal Server Error"
    };
  }
};
