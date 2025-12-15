import httpResponse from "../../shared/responses/http";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";
import { Envs } from "./types";

export const handler = async (event: any, _context: any) => {
  try {
    console.log("event =>>>", JSON.stringify(event, null, 2));

    checkEnv({ ...Envs });

    const parseResult = dto.parseEvent({ event });
    if (!parseResult.data) {
      return httpResponse({
        statusCode: 400,
        body: { success: false, message: parseResult.message }
      });
    }

    const { data } = parseResult.data;

    const model = new Model();

    const result = await model.buildShippingLabel(data);

    if (!result.success) {
      return httpResponse({
        statusCode: 400,
        body: result
      });
    }

    return httpResponse({
      statusCode: 200,
      body: result
    });
  } catch (err: any) {
    console.error("Error: ", err);
    return httpResponse({
      statusCode: 500,
      body: err
    });
  }
};
