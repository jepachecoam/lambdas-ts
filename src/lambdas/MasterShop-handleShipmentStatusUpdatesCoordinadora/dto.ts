import { sanitizeStatus } from "./utils";

const parsedParams = ({ event, context }: any) => {
  console.log("event =>>>", JSON.stringify(event, null, 2));
  const {
    evento: eventData,
    numero_guia: carrierTrackingCode,
    fecha_hora: dateSolution
  } = JSON.parse(event.body);
  const awsRequestId = context.awsRequestId;
  const environment = event.requestContext.stage || "dev";

  const isApprovedSolution = sanitizeStatus({ status: eventData });
  console.log(`Solution is ${isApprovedSolution ? "approved" : "rejected"}`);

  return {
    eventData,
    carrierTrackingCode,
    dateSolution,
    environment,
    isApprovedSolution,
    awsRequestId
  };
};

export default { parsedParams };
