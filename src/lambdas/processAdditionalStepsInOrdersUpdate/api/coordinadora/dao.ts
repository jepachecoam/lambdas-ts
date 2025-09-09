import { b2bClientCarriers } from "../../utils/b2bRequest";
class Dao {
  private environment: string;
  constructor(environment: string) {
    this.environment = environment;
  }

  sendToUpdateOrderQueue = async (payload: any) => {
    try {
      console.log("payloadSend to MasterShop-UpdateOrdersQueue", payload);

      const response = await b2bClientCarriers.post(
        `/${this.environment}/b2b/api/UpdateOrder`,
        payload
      );
      return response.data;
    } catch (err) {
      console.error("Error in sendEventData dao =>>>", err);
      throw err;
    }
  };
}

export default Dao;
