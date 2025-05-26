const parseEvent = ({ event }: any) => {
  const operationType = event["detail-type"];

  if (!["CHARGES", "PAYMENTS"].includes(operationType)) {
    throw new Error(`Unknown operation type: ${operationType}`);
  }

  return {
    operationType
  };
};

export default { parseEvent };
