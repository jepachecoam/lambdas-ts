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

    const environment = params.environment;

    const db = await dbSm({ environment: environment });

    const dao = new Dao(db, environment);

    const model = new Model(dao);

    const result = await model.process({ idOrder: params.idOrder });

    console.log("Result =>>>", result);
  } catch (err: any) {
    console.error("Error in handler", err);
    throw err;
  }
};
