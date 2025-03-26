const validateEnvVariables = (requiredVars: string[]): void | Error => {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }
};

export const checkEnv = (EnvVariables: object) => {
  validateEnvVariables(Object.values(EnvVariables));
};
