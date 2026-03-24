import Dao from "./dao";
import Dto, { PhoneWithCountry } from "./dto";

class Model {
  private dao: Dao;
  constructor(dao: Dao) {
    this.dao = dao;
  }

  getPhones(event: any) {
    const records = Dto.getRecords(event);
    return Dto.getPhones(records);
  }

  async sendNotification(recordsWithoutPhone: any, logStreamId: string) {
    console.log("recordsWithoutPhone...", JSON.stringify(recordsWithoutPhone));
  }

  async preloadCustomerStatistics(phones: PhoneWithCountry[]) {
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
    console.log("preloadCustomerStatistics", phones);

    const grouped = phones.reduce(
      (acc, item) => {
        (acc[item.country] ??= []).push(item.phone);
        return acc;
      },
      {} as Record<string, string[]>
    );

    for (const [country, countryPhones] of Object.entries(grouped)) {
      const statistics = await this.dao.getCustomerStatistics(
        countryPhones,
        country
      );
      if (!statistics) {
        console.log(`statistics not found for country ${country}`);
        continue;
      }
      for (const statistic of statistics) {
        const { phone, ...values } = statistic;
        const key = `customerStatistics-${phone}-${country}`;
        console.log("Saving on redis... key...", key);
        await this.dao.storeCachedItem({
          key,
          value: JSON.stringify(values),
          expireInSeconds: THIRTY_DAYS_IN_SECONDS
        });
      }
    }
  }
}

export default Model;
