import Dao from "./dao";
import Dto from "./dto";

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

    //    const body = {
    //      logGroup: logStreamId,
    //      resourceType: "lambda",
    //      data: JSON.stringify(recordsWithoutPhone)
    //    };

    //    await this.dao.sendNotification(body);
  }

  async preloadCustomerStatistics(phones: string[]) {
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
    console.log("preloadCustomerStatistics", phones);
    const statistics = await this.dao.getCustomerStatistics(phones);
    if (!statistics) {
      console.log("statistics not found");
      return null;
    }
    for (const statistic of statistics) {
      const { phone, ...values } = statistic;
      const key = `customerStatistics-${phone}`;
      console.log("Saving on redis... key...", key);
      await this.dao.storeCachedItem({
        key,
        value: JSON.stringify(values),
        expireInSeconds: THIRTY_DAYS_IN_SECONDS
      });
    }
  }
}

export default Model;
