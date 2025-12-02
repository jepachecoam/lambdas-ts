import Model from "./model";
import utils from "./utils";

export const handler = async (events: any): Promise<any> => {
  try {
    console.log("event :>>>", JSON.stringify(events));
    const event = JSON.parse(events.Records[0].body);

    const model = new Model(event.environment);

    await model.startStepFnExecution(event);

    // wait 2 minutes
    await new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000));

    return utils.response({
      statusCode: 200,
      message: "Success"
    });
  } catch (error: any) {
    console.error("ErrorLog =>>>", error);
    return utils.response({ statusCode: 500, message: error.message });
  }
};
