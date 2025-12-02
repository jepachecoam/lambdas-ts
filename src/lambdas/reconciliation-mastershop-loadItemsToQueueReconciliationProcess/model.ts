import Dao from "./dao";
import { config } from "./types";

class Model {
  private dao: Dao;

  constructor(_environment: string, dao: Dao) {
    this.dao = dao;
  }
  async loadItemsToQueue(operationType: string) {
    const batchSize = config.batchSize;

    console.log("batchSize =>>>", batchSize);

    let items = null;

    if (operationType === "CHARGES") {
      items = await this.dao.getCarrierCharge();
    }
    if (operationType === "PAYMENTS") {
      items = await this.dao.getCarrierPayments();
    }

    if (!items || items.length === 0) {
      console.log("No items to process");
      return;
    }

    console.log("items =>>>", items.length);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map((charge: any) =>
        this.dao.sendToQueue({ ...charge, operationType })
      );
      await Promise.all(batchPromises);
      console.log(`Processed batch ${i / batchSize + 1}`);
    }
  }
}

export default Model;
