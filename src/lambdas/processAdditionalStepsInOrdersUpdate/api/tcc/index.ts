import { EventProcessEnum } from "../../types";
import Model from "./model";

class Tcc {
  private model: Model;
  constructor(environment: string) {
    this.model = new Model(environment);
  }

  handleTccRequest = async ({ eventProcess }: any) => {
    if (eventProcess === EventProcessEnum.CRONJOB_NOVEDAD) {
      await this.model.insertIncidentId();
    } else {
      console.log("Process not found ");
    }
  };
}

export default Tcc;
