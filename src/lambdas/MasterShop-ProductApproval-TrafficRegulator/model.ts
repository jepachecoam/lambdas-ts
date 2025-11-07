import Dao from "./dao";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  startStepFnExecution = async (event: any) => {
    try {
      await this.dao.startStepFnExecution(event);
    } catch (error) {
      console.error("Error in startStepFnExecution model =>>>", error);
      throw error;
    }
  };
}

export default Model;
