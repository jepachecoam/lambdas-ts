import chargeModel from "./model/chargeModel";
import paymentModel from "./model/paymentModel";
import sharedModel from "./model/sharedModel";

export const handler = async (event: any, context: any) => {
  try {
    console.log("event =>>>", JSON.stringify(event));
    console.log("context =>>>", JSON.stringify(context));

    const { operationType } = sharedModel.parseEvent({ event });

    switch (operationType) {
      case "CHARGES":
        await chargeModel.processCharges();
        break;

      case "PAYMENTS":
        await paymentModel.processPayments();
        break;
      default:
        console.error(`Unknown operation type: ${operationType}`);
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OK" })
    };
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      body: err.message
    };
  }
};
