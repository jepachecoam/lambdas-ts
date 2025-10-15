function getParams(event: any) {
  console.log("event :>>>", JSON.stringify(event));

  const environment = event.environment;
  const idInvoince = event.idInvoice;

  if (!idInvoince || typeof idInvoince !== "number") {
    throw new Error("idInvoice is needed");
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
    idInvoince
  };
}

export default { getParams };
