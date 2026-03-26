import dbSm from "../../shared/databases/db-sm/db";
import { dbEnvSm } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import dto from "./dto";
import Model from "./model";
import { EnvsEnum } from "./types";

export const handler = async (event: any, _context: any) => {
  console.log("Event :>>>", JSON.stringify(event));

  try {
    checkEnv({ ...EnvsEnum, ...dbEnvSm });

    const params = dto.extractParams(event);

    const db = await dbSm({ environment: params.environment });

    const dao = new Dao(db);

    const model = new Model(dao);

    const result = await model.process(params.data);

    console.log("Result =>>>", result);
  } catch (err) {
    console.error("Error in handler", err);
    throw err;
  }
};
