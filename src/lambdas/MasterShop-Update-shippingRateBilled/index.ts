import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import dto from "./dto";
import Model from "./model";
import { EnvsEnum } from "./types";

export const handler = async (event: any, _context: any) => {
  console.log("Event :>>>", JSON.stringify(event));

  try {
    checkEnv({ ...EnvsEnum, ...dbEnv });

    const params = dto.extractParams(event);

    const dao = new Dao(params.stage);

    const model = new Model(dao);

    const result = await model.process(params);

    console.log("Result =>>>", result);
  } catch (err) {
    console.error("Error in handler", err);
    throw err;
  }
};
