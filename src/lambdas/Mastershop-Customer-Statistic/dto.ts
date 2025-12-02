function getParams(event: any) {
  const missingFields = [];

  let environment = null;
  let phone = null;

  if (event["detail-type"] === "CREATED-ORDER") {
    environment = event?.detail?.parameters?.stage;
    phone = event.detail?.customer?.phone;
  } else {
    environment = event.detail?.stage;
    phone = event.detail?.customer?.phone;
  }

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

function sanitizePhone(phone: string): string {
  return phone.replace(/\D+/g, "");
}

export default { getParams, sanitizePhone };
