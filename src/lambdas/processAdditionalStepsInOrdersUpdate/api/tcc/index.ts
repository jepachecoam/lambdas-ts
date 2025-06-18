import { EventProcessEnum } from "../../types";
import model from "./model";

const handleTccRequest = async ({ eventProcess }: any) => {
  if (eventProcess === EventProcessEnum.CRONJOB_NOVEDAD) {
    await model.insertIncidentId();
  } else {
    console.log("Process not found ");
  }
};

export default handleTccRequest;
