import { checkEnv } from "../../shared/envChecker";
import { dbEnv } from "../../shared/types";
import dto from "./dto";
import Model from "./model";
import { Envs } from "./types";

export const handler = async (event: any, _context: any) => {
  try {
    console.log("event =>>>", JSON.stringify(event, null, 2));

    checkEnv({ ...dbEnv, ...Envs });

    const { operationType, environment } = dto.parseEvent({ event });

    const model = new Model(environment);

    await model.loadItemsToQueue(operationType);

    console.log("Finished loadItemsToQueueReconciliationProcess");
  } catch (err: any) {
    console.error("Error:", err);
    throw err;
  }
};
