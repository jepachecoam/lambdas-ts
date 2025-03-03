import http from "../../shared/http";
import model from "./model";
import { checkEnv } from "./utils";
import { validateOrderTableFilters } from "./validations/params";
export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    checkEnv();
    console.log("Event =>>>", event);

    // validar que el negocio pertenezca al usuario logueado.

    const idUser = 66056;

    const { error, value } = validateOrderTableFilters(event);
    if (error) {
      return http.jsonResponse({
        statusCode: 400,
        message: error.message,
        result: {}
      });
    }
    const response = await model.getOrders(idUser, value);

    return http.jsonResponse({
      statusCode: 200,
      message: "hello word from lambda",
      result: response
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
