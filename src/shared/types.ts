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

enum QueryTypes {
  SELECT = "SELECT",
  INSERT = "INSERT",
  UPDATE = "UPDATE",
  DELETE = "DELETE"
}

export { QueryTypes, SecretsDatabase, SecretsGateways, ValidationResult };
