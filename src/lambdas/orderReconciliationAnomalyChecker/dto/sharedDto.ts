const parseEvent = ({ event }: any) => {
  const operationType = event["detail-type"];

  return {
    operationType
  };
};

export default { parseEvent };
