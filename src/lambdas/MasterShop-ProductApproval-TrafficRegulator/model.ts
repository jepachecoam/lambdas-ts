import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  startStepFnExecution = async (event: any) => {
    await this.dao.startStepFnExecution(event);
  };
}

export default Model;
