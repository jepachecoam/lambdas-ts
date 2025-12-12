import { ShippingLabelDataSchema } from "./types";

const parseEvent = ({ event }: any) => {
  try {
    const body =
      typeof event.body === "object"
        ? event.body
        : JSON.parse(event.body || "{}");

    const result = ShippingLabelDataSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        message: `Validation errors: ${errors.join(", ")}`,
        data: null
      };
    }

    const environment = event?.requestContext?.stage || "dev";

    return {
      message: "",
      data: { ...result },
      environment
    };
  } catch (error) {
    console.error("Error parsing event:", error);
    return { data: null, message: "Invalid JSON format in event.body" };
  }
};

export default { parseEvent };
