const extractParamsFromEvent = (event: any) => {
  console.log("event =>>>", JSON.stringify(event, null, 2));
  const eventProcess = event["eventProcess"];
  const carrier = String(event["detail-type"]).toLocaleLowerCase();
  const detail = event["detail"];
  return {
    carrier,
    detail,
    eventProcess
  };
};

export default { extractParamsFromEvent };
