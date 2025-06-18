import Database from "../../../shared/databases/sequelize";
import { envs } from "./envs";
export default new Database(envs.database.ENVIRONMENT);
