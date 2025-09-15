import { b2bClientCarriers } from "../../utils/request";
class Dao {
  private environment: string;
  constructor(environment: string) {
    this.environment = environment;
  }

  sendToUpdateOrderQueue = async (payload: any) => {
    try {
      const response = await b2bClientCarriers.post(
        `/${this.environment}/b2b/api/UpdateOrder`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };
}

export default Dao;
