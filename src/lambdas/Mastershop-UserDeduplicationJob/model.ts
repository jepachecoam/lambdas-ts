import Dao from "./dao";
class Model {
  constructor(private dao: Dao) {
    this.dao = dao;
  }

  async example() {}
}

export default Model;
