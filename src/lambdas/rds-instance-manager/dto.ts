const getParams = ({ event }: any) => {
  console.log("Event =>>>", JSON.stringify(event));

  const { action, rdsArns } = event;

  const missingFields = [];

  if (!action) {
    missingFields.push("action");
  }
  if (!rdsArns) {
    missingFields.push("rdsArns");
  }
  if (rdsArns && !Array.isArray(rdsArns)) {
    missingFields.push("rdsArns must be an array");
  }

  if (rdsArns && Array.isArray(rdsArns) && rdsArns.length === 0) {
    missingFields.push("rdsArns cannot be empty");
  }

  if (missingFields.length > 0) {
    throw new Error(`Missing data in event: ${missingFields.join(", ")}`);
  }

  if (action !== "start" && action !== "stop") {
    throw new Error("Invalid action. Must be 'start' or 'stop'");
  }

  return {
    action: action,
    rdsArns: rdsArns
  };
};

export default { getParams };
