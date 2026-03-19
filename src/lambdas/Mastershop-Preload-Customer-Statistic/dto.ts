export type PhoneWithCountry = { phone: string; country: string };

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

  static getPhones(records: any): {
    uniquePhones: PhoneWithCountry[];
    recordsWithoutPhone: any[];
  } {
    const phonesData = records.map((record: any) => {
      const phone = record.detail?.customer?.phone;
      const country = record.detail?.shipping_address?.country;
      return {
        record,
        phone: phone ? Dto.sanitizePhone(phone) : null,
        country: country || null
      };
    });

    const validEntries = phonesData.filter(
      (item: any) => item.phone && item.country
    );
    const recordsWithoutPhone = phonesData
      .filter((item: any) => !item.phone || !item.country)
      .map((item: any) => item.record);

    const seen = new Set<string>();
    const uniquePhones: PhoneWithCountry[] = [];
    for (const item of validEntries) {
      const key = `${item.phone}-${item.country}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePhones.push({ phone: item.phone, country: item.country });
      }
    }

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
