import CacheDB from "../../shared/databases/cache";
import dbSm from "../../shared/databases/db-sm/db";
import { dbEnvSm } from "../../shared/types/database";
import { redisEnv } from "../../shared/types/redis";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import Dto from "./dto";
import Model from "./model";
import { Envs } from "./types";

export const handler = async (event: any, context: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    checkEnv({ ...dbEnvSm, ...redisEnv, ...Envs });

    const { environment, logStreamId } = Dto.getEnvironment(context);
    console.log("environment :>>>", environment);

    const db = await dbSm(environment);

    const cacheDB = CacheDB.getInstance(environment);

    const dao = new Dao(db, cacheDB);

    const model = new Model(dao);

    const { recordsWithoutPhone, uniquePhones } = model.getPhones(event);

    if (recordsWithoutPhone.length > 0) {
      await model.sendNotification(recordsWithoutPhone, logStreamId);
    }

    await model.preloadCustomerStatistics(uniquePhones);

    console.log("Success process");
  } catch (error: any) {
    console.error("ErrorLog :>>>", error);
  }
};
