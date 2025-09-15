import httpResponse from "../../shared/responses/http";
import Dao from "./dao";
import { CustomerNormalizer } from "./normalizer";

export const handler = async (
  event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    const dao = new Dao("prod");
    const customers: any = await dao.getCustomers();

    if (!customers) {
      console.log("No customers found");
      return httpResponse({
        statusCode: 404,
        body: "No customers found"
      });
    }

    const normalizer = new CustomerNormalizer();
    const normalizedResults = normalizer.normalize(customers);

    return httpResponse({
      statusCode: 200,
      body: normalizedResults
    });
  } catch (error) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: error
    });
  }
};
