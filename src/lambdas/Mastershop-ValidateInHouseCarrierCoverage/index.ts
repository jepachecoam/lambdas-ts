import dbSm from "../../shared/databases/db-sm/db";
import httpResponse from "../../shared/responses/http";
import { dbEnvSm } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import dto from "./dto";
import Model from "./model";

export const handler = async (event: any, _context: any) => {
  try {
    console.log("event =>>>", JSON.stringify(event, null, 2));

    checkEnv({ ...dbEnvSm });

    const {
      origin,
      destination,
      idBusiness,
      environment,
      idUserCarrierPreference
    } = dto.parseEvent({
      event
    });

    const dbIntance = await dbSm(environment);

    const dao = new Dao(dbIntance);

    const model = new Model(dao);

    const result = await model.validateCoverage({
      idBusiness,
      idUserCarrierPreference,
      origin,
      destination
    });

    console.log("result :>>>", JSON.stringify(result));

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
    return httpResponse({
      statusCode: 500,
      body: err
    });
  }
};
