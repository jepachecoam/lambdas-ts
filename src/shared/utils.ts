import { SecretsDatabase, SecretsGateways, ValidationResult } from "./types";

function formatNumberSetTwoDecimals(value: number | string): number {
  const truncated = Math.floor(Number(value) * 100) / 100;
  const [integerPart, decimalPart = "00"] = truncated.toFixed(2).split(".");
  return parseInt(`${integerPart}${decimalPart}`);
}

function formatNumberRemoveDecimals(value: number | string): number {
  const num = Number(value);
  if (num % 1 !== 0) return Math.floor(num);
  if (num < 100) return 0;
  return Math.floor(num / 100);
}

function isValidString(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function validateSecretsGateways(data: SecretsGateways): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
  };

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Input data must be an object"],
    };
  }

  if (!("MONO_URL" in data)) {
    result.errors.push("MONO_URL is missing");
  } else if (!isValidString(data.MONO_URL)) {
    result.errors.push("MONO_URL is not a valid URL");
  }

  if (!("MONO_TOKEN" in data)) {
    result.errors.push("MONO_TOKEN is missing");
  } else if (!isValidString(data.MONO_TOKEN)) {
    result.errors.push("MONO_TOKEN is empty or invalid");
  }

  if (!("MONO_ACCOUNT" in data)) {
    result.errors.push("MONO_ACCOUNT is missing");
  } else if (!isValidString(data.MONO_ACCOUNT)) {
    result.errors.push("MONO_ACCOUNT is empty or invalid");
  }

  if (!("COBRE_URL" in data)) {
    result.errors.push("COBRE_URL is missing");
  } else if (!isValidString(data.COBRE_URL)) {
    result.errors.push("COBRE_URL is not a valid URL");
  }

  if (!("COBRE_ACCOUNT" in data)) {
    result.errors.push("COBRE_ACCOUNT is missing");
  } else if (!isValidString(data.COBRE_ACCOUNT)) {
    result.errors.push("COBRE_ACCOUNT is empty or invalid");
  }

  if (!("COBRE_USER_ID" in data)) {
    result.errors.push("COBRE_USER_ID is missing");
  } else if (!isValidString(data.COBRE_USER_ID)) {
    result.errors.push("COBRE_USER_ID is empty or invalid");
  }

  if (!("COBRE_SECRET" in data)) {
    result.errors.push("COBRE_SECRET is missing");
  } else if (!isValidString(data.COBRE_SECRET)) {
    result.errors.push("COBRE_SECRET is empty or invalid");
  }

  result.isValid = result.errors.length === 0;
  return result;
}

function validateSecretsDatabase(data: SecretsDatabase): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
  };

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: ["Input data must be an object"],
    };
  }

  if (!("username" in data)) {
    result.errors.push("username is missing");
  } else if (!isValidString(data.username)) {
    result.errors.push("username is not a valid URL");
  }

  if (!("password" in data)) {
    result.errors.push("password is missing");
  } else if (!isValidString(data.password)) {
    result.errors.push("password is empty or invalid");
  }

  result.isValid = result.errors.length === 0;
  return result;
}

export {
  formatNumberSetTwoDecimals,
  formatNumberRemoveDecimals,
  validateSecretsGateways,
  validateSecretsDatabase,
};
