class Dto {
  static getEnvironment(context: any) {
    const arn = context.invokedFunctionArn;
    const lastPart = arn.split(":").pop();
    return lastPart === "qa" || lastPart === "dev" ? lastPart : "prod";
  }
  static getRecords(event: any) {
    return event.Records.map((record: any) => JSON.parse(record.body));
  }

  static getPhones(records: any) {
    const mapped = records.map((record: any) => {
      const phone = record.detail?.customer?.phone;
      return phone ? Dto.sanitizePhone(phone) : null;
    });

    const phones = mapped.filter(Boolean);
    const hasNullValues = mapped.length !== phones.length;
    const uniquePhones: any = [...new Set(phones)];

    return { uniquePhones, hasNullValues };
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
