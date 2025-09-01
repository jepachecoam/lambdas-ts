const extractParamsFromEvent = (event: any) => {
  console.log("event =>>>", JSON.stringify(event, null, 2));
  const eventProcess = event["eventProcess"];
  const carrier = String(event["detail-type"]).toLocaleLowerCase();
  const detail = event["detail"];
  let environment = detail?.environment ?? "prod";
  if (!["qa", "dev"].includes(environment)) {
    environment = "prod";
  }
  return {
    carrier,
    detail,
    eventProcess,
    environment
  };
};

export default { extractParamsFromEvent };
