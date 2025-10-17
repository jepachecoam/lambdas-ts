function getParams(event: any) {
  console.log("event :>>>", JSON.stringify(event));

  const environment = event.requestContext?.stage;
  const pathParameters = event.pathParameters;
  const idInvoice = pathParameters?.idInvoice;

  if (!idInvoice || typeof idInvoice !== "string" || !/^\d+$/.test(idInvoice)) {
    throw new Error("idInvoice must be a valid number");
  }

  if (
    !environment ||
    typeof environment !== "string" ||
    !["prod", "dev", "qa"].includes(environment)
  ) {
    throw new Error("Environment is needed");
  }

  return {
    ...event,
    environment,
    idInvoice: Number(idInvoice)
  };
}

export default { getParams };
