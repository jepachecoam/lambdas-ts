import axios, { AxiosInstance, AxiosResponse } from "axios";

class Request {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      headers: {
        "x-api-key": process.env["API_KEY_MS"],
        "x-app-name": process.env["APP_NAME_MS"]
      }
    });
  }

  async fetchMainOrder({
    idUser,
    idOrder,
    idBusiness
  }: {
    idUser: number;
    idOrder: number;
    idBusiness: number;
  }) {
    try {
      const parameter = {
        orderId: idOrder,
        idBussiness: idBusiness
      };
      const response: AxiosResponse = await this.client.post(
        `${process.env["URL_MS"]}/api/b2b/logistics/order/${idUser}`,
        parameter
      );
      return response.data.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async sendEvent({ source, detailType, detail }: any) {
    try {
      const parameter = {
        source,
        detailType,
        detail
      };

      console.log(
        "payloadSend to MASTERSHOP-SHIPMENT-UPDATE =>>>",
        parameter
      );

      const response: AxiosResponse = await this.client.post(
        `${process.env["URL_API_SEND_EVENT"]}/api/b2b/logistics/processevents`,
        parameter
      );
      return response.data;
    } catch (err) {
      console.error("Error in sendEventData request =>>>", err);
      throw err;
    }
  }
}

export default Request;
