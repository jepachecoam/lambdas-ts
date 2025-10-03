const validateEnvVariables = (requiredVars: string[]): void | Error => {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }
};

type EnvRecord<T extends Record<string, string>> = {
  [K in keyof T]: string;
};

export const checkEnv = <T extends Record<string, string>>(
  EnvVariables: T
): EnvRecord<T> => {
  const envKeys = Object.values(EnvVariables);
  validateEnvVariables(envKeys);

  const envValues = {} as EnvRecord<T>;
  for (const [key, envKey] of Object.entries(EnvVariables)) {
    envValues[key as keyof T] = process.env[envKey]!;
  }

  return envValues;
};
