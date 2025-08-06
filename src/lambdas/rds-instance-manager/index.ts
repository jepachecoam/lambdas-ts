import httpResponse from "../../shared/responses/http";
import dto from "./dto";
import Model from "./model";

export const handler = async (
  event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    const params = dto.getParams({ event });

    console.log("params =>>>", params);

    const model = new Model();
    await model.manageRDSInstances(params);

    return httpResponse({
      statusCode: 200,
      body: "RDS instances processed successfully"
    });
  } catch (error) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: error
    });
  }
};
