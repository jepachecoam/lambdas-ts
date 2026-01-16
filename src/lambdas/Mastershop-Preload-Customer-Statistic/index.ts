import dbSm from "../../shared/databases/db-sm/db";
import Dao from "./dao";
import Dto from "./dto";
import Model from "./model";
export const handler = async (event: any, context: any) => {
  try {
    console.log("event :>>>", JSON.stringify(event));

    const environment = Dto.getEnvironment(context);
    console.log("environment :>>>", environment);

    const db = await dbSm(environment);

    const dao = new Dao(db);

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
