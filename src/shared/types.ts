type SecretsGateways = {
  MONO_URL: string;
  MONO_TOKEN: string;
  MONO_ACCOUNT: string;
  COBRE_URL: string;
  COBRE_ACCOUNT: string;
  COBRE_USER_ID: string;
  COBRE_SECRET: string;
};

type SecretsDatabase = {
  username: string;
  password: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export { SecretsGateways, SecretsDatabase, ValidationResult };
