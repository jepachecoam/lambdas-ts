import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import Dto from "./dto";
import Model from "./model";
import { Envs } from "./types";
export const handler = async (event: any) => {
  try {
    checkEnv({ ...dbEnv, ...Envs });

    const { bucket, key, conciliationType, environment } = Dto.getParams(event);

    const model = new Model(environment);

    const workbookReaderStream = await model.getWorkbookReaderStream(
      bucket,
      key
    );

    await model.processWorksheet(workbookReaderStream, conciliationType);

    console.log("Finished processWorksheet");
  } catch (err: any) {
    console.error(err);
    await Model.sendSlackNotification({
      conciliationType: "",
      step: "",
      data: err.message ? err.message : err,
      environment: ""
    });
  }
};
