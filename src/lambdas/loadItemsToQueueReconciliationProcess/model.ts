import { EnvironmentTypes } from "../../shared/types";
import Dao from "./dao";
import { Envs } from "./types";

class Model {
  private dao: Dao;

  constructor(environment: EnvironmentTypes) {
    this.dao = new Dao(environment);
  }

  async loadItemsToQueue(operationType: string) {
    const batchSize = parseInt(`${process.env[Envs.BATCH_SIZE]}`);

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
