import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dto from "./dto";
import Model from "./model";
import { Envs } from "./types";
export const handler = async (event: any, _context: any) => {
  try {
    checkEnv({ ...dbEnv, ...Envs });
    const { records, environment } = Dto.parseEvent(event);

    const model = new Model(environment);

    await model.processRecords(records);

    console.log("Finished processRecords");
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};
