import dto from "./dto";
import Model from "./model";
import { InputEvent } from "./types";
import utils from "./utils";

export const handler = async (event: InputEvent, context: any) => {
  let model = null;

  try {
    console.log("event :>>>", JSON.stringify(event));

    const data = dto.eventParser(event);
    model = new Model(event.environment);

    if (data.statusCode !== 200) {
      await model.sendError({
        lastValidator: data.origin,
        idTicket: data.idTicket,
        observations: data.error || "Error in validation process"
      });

      return utils.response({
        statusCode: 200,
        message: "Incomplete validation"
      });
    }

    await model.process(data);

    return utils.response({ statusCode: 200, message: "Validation completed" });
  } catch (error: any) {
    console.error("ErrorLog =>>>", error);

    if (model) {
      try {
        await model.sendToSlack({
          requestId: context.awsRequestId,
          error: (error as Error).message,
          event: JSON.stringify(event)
        });
      } catch (error) {
        console.error("Error sending message to slack: ", error);
      }
    } else {
      console.error("Error sending message to slack: ", error);
    }

    return utils.response({ statusCode: 500, message: error.message });
  }
};
