import { checkEnv } from "../../shared/envChecker";
import { dbEnv } from "../../shared/types";
import Dto from "./dto";
import Model from "./model";
import { Envs } from "./types";
export const handler = async (event: any, _context: any) => {
  try {
    checkEnv({ ...dbEnv, ...Envs });
    const { records, environment } = Dto.parseEvent(event);

    const model = new Model(environment);

    await model.processRecords(records);
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};
