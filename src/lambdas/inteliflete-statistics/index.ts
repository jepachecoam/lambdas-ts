import http from "../../shared/responses/http";
import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";

export const handler = async (event: any, _context: any): Promise<any> => {
  try {
    checkEnv({ ...dbEnv });

    const environment = dto.parseParams(event);

    const model = new Model(environment);
    await model.updateStatistics();
    console.log("Finished updateStatistics");
  } catch (error) {
    console.error("Error:", error);
  }
};
