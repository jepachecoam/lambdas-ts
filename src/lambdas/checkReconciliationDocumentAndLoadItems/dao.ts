import S3 from "../../shared/services/S3";
import Database from "../../shared/services/sequelize";
import { EnvironmentTypes } from "../../shared/types";

class Dao {
  private S3 = new S3();
  private db: Database;

  constructor(environment: EnvironmentTypes) {
    this.db = new Database(environment);
  }
  async getStream(bucket: string, key: string) {
    return this.S3.getStream(bucket, key);
  }
}

export default Dao;
