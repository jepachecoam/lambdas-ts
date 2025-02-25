import { validateEnvVariables } from "../../shared/utils/envChecker";

export const checkEnv = () => {
  validateEnvVariables(["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]);
};
