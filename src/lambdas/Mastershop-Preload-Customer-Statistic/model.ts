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

  async sendNotification() {
    console.log("Sending notification to slack channel...");
  }

  async preloadCustomerStatistics(phones: string[]) {
    console.log("preloadCustomerStatistics", phones);
    const statistics = await this.dao.getCustomerStatistics(phones);
    if (!statistics) {
      console.log("statistics not found");
      return null;
    }
    for (const statistic of statistics) {
      console.log("statistic", statistic);
    }
  }
}

export default Model;
