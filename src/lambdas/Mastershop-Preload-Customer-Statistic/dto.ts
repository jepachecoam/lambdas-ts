function getParams(event: any) {
  const missingFields = [];

  const environment = event?.detail?.parameters?.stage;
  const phone = event.detail?.customer?.phone;

  if (!environment) missingFields.push("environment");
  if (!phone) missingFields.push("phone");

  if (missingFields.length > 0) {
    throw new Error(`Missing fields: ${missingFields.join(", ")}`);
  }

  return {
    environment: environment,
    phone: phone
  };
}

export default { getParams };
