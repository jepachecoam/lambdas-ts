import dbSm from "../../shared/databases/db-sm/db";
import { dbEnvSm } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import dto from "./dto";
import Model from "./model";
import { Envs } from "./types";

export const handler = async (event: any, _context: any) => {
  try {
    console.log("event =>>>", JSON.stringify(event, null, 2));

    checkEnv({ ...Envs, ...dbEnvSm });

    const { operationType, environment } = dto.parseEvent({ event });

    const db = await dbSm({ environment: environment });

    const dao = new Dao(environment, db);

    const model = new Model(environment, dao);

    await model.loadItemsToQueue(operationType);

    console.log("Finished loadItemsToQueueReconciliationProcess");
  } catch (err: any) {
    console.error("Error:", err);
    throw err;
  }
};
