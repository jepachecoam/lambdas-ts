import {
  ProcessedEventData,
  Validation,
  ValidationData,
  ValidationStatus,
  ValidationType,
  Validator,
  VariantValidation
} from "./types";

const eventParser = (event: any): ProcessedEventData => {
  const origin =
    event.aiValidationResult?.origin || event.basicValidationResult?.origin; // TODO: || human

  if (origin === Validator.CODE) {
    return codeEventParser(event);
  } else if (origin === Validator.AI) {
    return aIEventParser(event);
  } else if (origin === Validator.HUMAN) {
    return humanEventParser(event);
  }

  throw new Error("Invalid event origin");
};

const codeEventParser = (event: any): ProcessedEventData => {
  const data = event.basicValidationResult;
  return {
    statusCode: data.statusCode,
    origin: Validator.CODE,
    result: determineResult(data.validations),
    idTicket: event.idTicket,
    idUser: event.idUser,
    idProduct: event.idProduct,
    validations: data.validations,
    suggestions: {},
    error: data.error
  };
};

const aIEventParser = (event: any): ProcessedEventData => {
  const data = event.aiValidationResult;
  return {
    statusCode: data.statusCode,
    origin: Validator.AI,
    result: determineResult(data.validations),
    idTicket: event.idTicket,
    idUser: event.idUser,
    idProduct: event.idProduct,
    validations: data.validations,
    suggestions: data.suggestions, // TODO: ajustar formato
    error: data.error
  };
};

const humanEventParser = (event: any): ProcessedEventData => {
  return {
    statusCode: event.statusCode,
    origin: Validator.HUMAN,
    idTicket: event.idTicket,
    idUser: event.idUser,
    idProduct: event.idProduct,
    result: event.result,
    note: event.note,
    validations: {},
    suggestions: {}
  };
};

const determineResult = (validations: ValidationData): ValidationStatus => {
  const hasRejected = hasValidationType(validations, ValidationType.REJECTED);
  const hasUnderReview = hasValidationType(
    validations,
    ValidationType.UNDER_REVIEW
  );

  if (hasRejected) return ValidationStatus.REJECTED;
  if (hasUnderReview) return ValidationStatus.UNDER_REVIEW;
  return ValidationStatus.APPROVED;
};

const hasValidationType = (
  input: ValidationData | Validation[] | VariantValidation[],
  type: ValidationType
): boolean => {
  const isValidation = (item: any): item is Validation => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.key === "string" &&
      typeof item.type === "string"
    );
  };
  const isVariantValidation = (item: any): item is VariantValidation => {
    return (
      typeof item === "object" &&
      item !== null &&
      typeof item.idVariant === "string" &&
      Array.isArray(item.price) &&
      Array.isArray(item.weight) &&
      Array.isArray(item.stock)
    );
  };

  if (input === null || input === undefined) {
    return false;
  } else if (["string", "number", "boolean"].includes(typeof input)) {
    return false;
  } else if (Array.isArray(input)) {
    if (input.length === 0) return false;

    if (input.every(isValidation)) {
      return input.some((item) => item.type === type);
    }
    if (input.every(isVariantValidation)) {
      return input.some((variant) =>
        Object.values(variant).some((value) => hasValidationType(value, type))
      );
    }
  } else if (typeof input === "object") {
    return Object.values(input).some((value) => hasValidationType(value, type));
  }

  return false;
};

export default {
  eventParser,
  determineResult
};
