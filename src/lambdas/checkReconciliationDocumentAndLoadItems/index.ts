import { checkEnv } from "../../shared/envChecker";
import { contextEnv, dbEnv } from "../../shared/types";
import Dto from "./dto";
import Model from "./model";

export const handler = async (event: any) => {
  try {
    checkEnv({ ...contextEnv, ...dbEnv });

    const { bucket, key, conciliationType } = Dto.getParams(event);

    const model = new Model("dev");

    const workbookReaderStream = await model.getWorkbookReaderStream(
      bucket,
      key
    );
    await model.processWorksheet(workbookReaderStream, conciliationType);
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};
