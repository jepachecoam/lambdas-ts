import CacheDB from "../../shared/databases/cache";
import dbSm from "../../shared/databases/db-sm/db";
import { dbEnvSm } from "../../shared/types/database";
import { redisEnv } from "../../shared/types/redis";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import Dto from "./dto";
import Model from "./model";

export const handler = async (event: any, context: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    checkEnv({ ...dbEnvSm, ...redisEnv });

    const environment = Dto.getEnvironment(context);
    console.log("environment :>>>", environment);

    const db = await dbSm(environment);

    const cacheDB = CacheDB.getInstance(environment);

    const dao = new Dao(db, cacheDB);

    const model = new Model(dao);

    const { hasNullValues, uniquePhones } = model.getPhones(event);

    if (hasNullValues) {
      await model.sendNotification();
    }

    await model.preloadCustomerStatistics(uniquePhones);

    console.log("Success process");
  } catch (error: any) {
    console.error("ErrorLog :>>>", error);
  }
};
