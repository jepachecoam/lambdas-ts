const parseEvent = ({ event }: any) => {
  const operationType = event["detail-type"];
  const environment = event?.detail?.environment;

  if (!["CHARGES", "PAYMENTS"].includes(operationType)) {
    throw new Error(`Unknown operation type: ${operationType}`);
  }

  if (!["dev", "prod", "qa"].includes(environment)) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  console.log("operationType =>>>", operationType);
  console.log("environment =>>>", environment);

  return {
    operationType,
    environment
  };
};

export default { parseEvent };
