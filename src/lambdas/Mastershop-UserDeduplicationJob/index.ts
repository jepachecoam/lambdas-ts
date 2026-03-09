import dbSm from "../../shared/databases/db-sm/db";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import Model from "./model";
import { config, envs } from "./types";
export const handler = async (event: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    checkEnv({ ...envs });

    const connectoolDB = await dbSm({
      customSecretName: config.CT_DB_SECRET
    });
    const MSDB = await dbSm({ customSecretName: config.MS_DB_SECRET });

    const dao = new Dao(connectoolDB, MSDB);

    const model = new Model(dao);

    await model.processAndUpdateDuplicateClusters();

    console.log("Success process");
  } catch (error: any) {
    console.error("ErrorLog :>>>", error);
  }
};
