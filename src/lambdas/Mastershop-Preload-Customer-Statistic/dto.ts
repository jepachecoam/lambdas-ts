class Dto {
  static getEnvironment(context: any) {
    const logStreamId = context.logStreamName;

    const arn = context.invokedFunctionArn;
    const lastPart = arn.split(":").pop();
    const environment =
      lastPart === "qa" || lastPart === "dev" ? lastPart : "prod";

    return { environment, logStreamId };
  }
  static getRecords(event: any) {
    return event.Records.map((record: any) => JSON.parse(record.body));
  }

  static getPhones(records: any) {
    const phonesData = records.map((record: any) => {
      const phone = record.detail?.customer?.phone;
      return {
        record,
        phone: phone ? Dto.sanitizePhone(phone) : null
      };
    });

    const validPhones = phonesData
      .filter((item: any) => item.phone)
      .map((item: any) => item.phone);
    const recordsWithoutPhone = phonesData
      .filter((item: any) => !item.phone)
      .map((item: any) => item.record);
    const uniquePhones: any = [...new Set(validPhones)];

    return { uniquePhones, recordsWithoutPhone };
  }

  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== "string") {
      return "";
    }
    const countryPhoneCodes = [
      "1", // United States, Canada
      "52", // Mexico
      "54", // Argentina
      "55", // Brazil
      "56", // Chile
      "57", // Colombia
      "58", // Venezuela
      "51", // Peru
      "593", // Ecuador
      "591", // Bolivia
      "595", // Paraguay
      "598" // Uruguay
    ];
    const cleanPhone = phone.replace(/\D+/g, "");

    for (const code of countryPhoneCodes) {
      if (cleanPhone.startsWith(code)) {
        return cleanPhone.substring(code.length);
      }
    }

    return cleanPhone;
  }
}

export default Dto;
