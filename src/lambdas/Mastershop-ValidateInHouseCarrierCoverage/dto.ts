const parseEvent = ({ event }: any) => {
  try {
    const body =
      typeof event.detail.body === "object"
        ? event.detail.body
        : JSON.parse(event.detail.body);

    const errors: string[] = [];

    if (typeof body.idBusiness !== "number") errors.push("idBusiness");
    if (!body.origin?.department) errors.push("origin.department");
    if (!body.origin?.city) errors.push("origin.city");
    if (!body.destination?.department) errors.push("destination.department");
    if (!body.destination?.city) errors.push("destination.city");
    if (!body.idUserCarrierPreference) errors.push("idUserCarrierPreference");

    if (errors.length > 0) {
      return {
        error: true,
        message: `Missing or invalid fields: ${errors.join(", ")}`
      };
    }

    const environment = event.detail.environment || "dev";

    return {
      idBusiness: body.idBusiness,
      origin: body.origin,
      destination: body.destination,
      idUserCarrierPreference: body.idUserCarrierPreference,
      environment: environment,
      error: false
    };
  } catch {
    return { error: true, message: "Invalid JSON format in event.detail.body" };
  }
};

export default { parseEvent };
