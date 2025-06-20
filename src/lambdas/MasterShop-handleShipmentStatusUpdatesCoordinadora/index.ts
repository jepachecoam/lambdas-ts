import { dbEnv } from "../../shared/types/database";
import { checkEnv } from "../../shared/validation/envChecker";
import dto from "./dto";
import Model from "./model";
import { Envs, OrderSourceEnum } from "./types";

export const handler = async (event: any, context: any) => {
  try {
    const params = dto.parsedParams({ event, context });
    checkEnv({ ...dbEnv, ...Envs });

    const {
      environment,
      awsRequestId,
      carrierTrackingCode,
      dateSolution,
      eventData,
      isApprovedSolution
    } = params;

    if (!eventData || !carrierTrackingCode || !dateSolution) {
      return buildResponse(400, "Missing required event data.");
    }

    const model = new Model(environment);

    const orderSource = await model.getOrderSource({
      carrierTrackingCode
    });

    console.log("orderSource =>>>", orderSource);

    if (!orderSource) {
      return buildResponse(202, "Accepted (no order source found)");
    }

    const shipmentData: any = await model.getShipmentData({
      orderSource,
      carrierTrackingCode
    });

    if (!shipmentData) {
      return buildResponse(202, "Accepted (no shipment data found)");
    }

    const dataForSaveConversation = {
      ...shipmentData,
      carrierTrackingCode,
      isApprovedSolution,
      environment,
      awsRequestId
    };

    if (orderSource === OrderSourceEnum.ORDER) {
      await model.saveConversation({ dataForSaveConversation });
    }

    await model.updateHistoryStatus({
      orderSource,
      idOrderHistory: shipmentData.idOrderHistory,
      isApprovedSolution,
      shipmentData
    });

    return buildResponse(202, "Accepted");
  } catch (error) {
    console.error("Error processing event:", error);
    return buildResponse(500, "Internal Server Error");
  }
};

const buildResponse = (statusCode: number, message: string) => ({
  statusCode,
  body: JSON.stringify({ message })
});
