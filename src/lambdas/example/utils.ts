import { validateEnvVariables } from "../../shared/utils/envChecker";
import { EnvVariables } from "./validations/interfaces";

export const checkEnv = () => {
  validateEnvVariables(Object.values(EnvVariables));
};
