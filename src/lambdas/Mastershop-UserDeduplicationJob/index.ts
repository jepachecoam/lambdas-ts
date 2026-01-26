import dbSm from "../../shared/databases/db-sm/db";
import { dbEnvSm } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dao from "./dao";
import Model from "./model";

export const handler = async (event: any, context: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    checkEnv({ ...dbEnvSm });

    const connectoolDB = await dbSm({ customSecret: "" });
    const MSDB = await dbSm({ customSecret: "" });

    const dao = new Dao(connectoolDB, MSDB);

    const model = new Model(dao);

    await model.example();

    console.log("Success process");
  } catch (error: any) {
    console.error("ErrorLog :>>>", error);
  }
};
