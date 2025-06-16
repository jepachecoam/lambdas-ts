const extractParamsFromEvent = (event: any) => {
  const eventProcess = event["eventProcess"];
  const carrier = String(event["detail-type"]).toLocaleLowerCase();
  const detail = event["detail"];
  console.log("event =>>>", JSON.stringify(event, null, 2));
  return {
    carrier,
    detail,
    eventProcess
  };
};

export default { extractParamsFromEvent };
