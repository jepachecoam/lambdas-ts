import { resolveIdCustomerSchema } from "./types/schema";

function getParams(event: any) {
  console.log("event :>>>", JSON.stringify(event));

  const environment = event.environment || "dev";

  return {
    ...event,
    environment
  };
}

function validateResolveIdCustomer(data: unknown) {
  try {
    const value = resolveIdCustomerSchema.parse(data);
    return { error: null, value };
  } catch (error: any) {
    return {
      error: {
        message:
          error.errors?.map((e: any) => e.message).join(", ") || error.message
      },
      value: null
    };
  }
}

export default {
  getParams,
  validateResolveIdCustomer
};
