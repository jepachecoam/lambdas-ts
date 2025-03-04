import { validateEnvVariables } from "../../shared/utils/envChecker";
import { EnvVariables } from "./validations/types";

export const checkEnv = () => {
  validateEnvVariables(Object.values(EnvVariables));
};
