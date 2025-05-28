const parseEvent = (event: any) => {
  console.log("event =>>>", JSON.stringify(event));
  if (
    !event.Records ||
    !Array.isArray(event.Records) ||
    !event.Records.length ||
    !event.Records[0] ||
    !event.Records[0].body
  ) {
    throw new Error("❌ Evento inválido.");
  }
  return event.Records.map((record: any) => JSON.parse(record.body));
};
export default { parseEvent };
