import dto from "./dto";
import Model from "./model";
import utils from "./utils";

export const handler = async (event: any) => {
  try {
    console.log("event =>>>", event);

    const {
      carrierName,
      idCarrier,
      batchSizeToFetch,
      batchSizeToSend,
      environment = "prod"
    } = event;

    const model = new Model(environment);

    const ordersToUpdate = await model.getOrdersToUpdate({ idCarrier });

    const { haveErrors, successfulOperations } =
      await model.fetchOrdersResponses({
        ordersToUpdate,
        batchSizeToFetch,
        carrierName
      });

    const ordersResponsesParsed = dto.checkResponses({
      ordersResponses: successfulOperations,
      carrierName
    });

    await model.sendCarrierDataToUpdateOrder({
      ordersResponsesParsed,
      batchSizeToSend
    });

    return haveErrors
      ? utils.response({ statusCode: 500, message: "Some order/s have error" })
      : utils.response({
          statusCode: 200,
          message: "Success"
        });
  } catch (error: any) {
    console.error("ErrorLog =>>>", error);
    return utils.response({ statusCode: 500, message: error.message });
  }
};
