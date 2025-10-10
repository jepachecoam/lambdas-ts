function getParams(event: any) {
  console.log("event :>>>", JSON.stringify(event));

  const environment = event.environment;

  if (
    !environment ||
    typeof environment !== "string" ||
    !["prod", "dev", "qa"].includes(environment)
  ) {
    throw new Error("Environment is needed");
  }

  return {
    ...event,
    environment
  };
}

export default { getParams };
