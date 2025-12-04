import { b2bRequest } from "../../shared/services/httpRequest";

class Dao {
  private environment: string;

  constructor(environment: string) {
    this.environment = environment;
  }

  async getCustomerStatistics(phone: string) {
    const result = await b2bRequest.get(
      `${this.environment}/api/b2b/orderLogistics/customer/metrics/byPhone/${phone}?withoutCache=1`
    );
    return result?.data?.data ?? null;
  }
}

export default Dao;
