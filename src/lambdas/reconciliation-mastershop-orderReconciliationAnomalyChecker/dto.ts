class Dto {
  static parseEvent(event: any) {
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

    const records = event.Records.map((record: any) => JSON.parse(record.body));
    const environment = process.env["ENVIRONMENT"]!;

    return { records, environment };
  }
}

export default Dto;
