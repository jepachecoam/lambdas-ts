import { validateEnvVariables } from "../../shared/utils/envChecker";
import { EnvVariables } from "./enums";

export const checkEnv = () => {
  validateEnvVariables(Object.values(EnvVariables));
};
