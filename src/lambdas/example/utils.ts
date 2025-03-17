import { validateEnvVariables } from "../../shared/envChecker";
import { EnvVariables } from "./enums";

export const checkEnv = () => {
  validateEnvVariables(Object.values(EnvVariables));
};
