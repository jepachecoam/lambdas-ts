import { checkEnv } from "../../shared/envChecker";
import http from "../../shared/http";
import { dbEnv } from "../../shared/types";
import dto from "./dto";
import Model from "./model";
import { statusType } from "./types/types";

export const handler = async (
  event: unknown,
  _context: unknown
): Promise<any> => {
  try {
    checkEnv(dbEnv);
    const params = dto.getParams({ event });

    console.log("params =>>>", params);

    const model = new Model(params.environment);

    switch (params.action) {
      case "block":
        await model.blockEntities({
          idUser: params.idUser,
          idBusiness: params.idBusiness,
          idBlacklistReason: params.idBlacklistReason
        });
        break;
      case "unblock":
        await model.updateStatusEntities({
          idBusiness: params.idBusiness,
          newStatus: statusType.INACTIVE,
          idBlacklistReason: params.idBlacklistReason
        });
        break;
      default:
        console.log("Action not found");
        throw new Error("Action not found");
    }

    return http.jsonResponse({
      statusCode: 200,
      message: "hello word from lambda",
      result: {}
    });
  } catch (error) {
    console.error("Error:", error);
    return http.jsonResponse({
      statusCode: 500,
      message: "Internal server error",
      result: {}
    });
  }
};
