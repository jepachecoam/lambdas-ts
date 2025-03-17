import { validateEnvVariables } from "../../../shared/envChecker";
import { EnvVariables } from "../types/types";

export const checkEnv = () => {
  validateEnvVariables(Object.values(EnvVariables));
};
