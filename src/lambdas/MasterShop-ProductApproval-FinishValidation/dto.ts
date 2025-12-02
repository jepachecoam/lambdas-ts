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
  if (event.aiValidationResult) {
    return aIEventParser(event);
  } else if (event.basicValidationResult) {
    return codeEventParser(event);
  } else if (event.origin === Validator.HUMAN) {
    return humanEventParser(event);
  }

  throw new Error("Invalid event origin");
};

const codeEventParser = (event: any): ProcessedEventData => {
  const data = event.basicValidationResult;
  return {
    statusCode: data.statusCode,
    origin: Validator.CODE,
    result: data.validations
      ? determineResult(data.validations)
      : ValidationStatus.UNDER_REVIEW,
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
    result: data.validations
      ? determineResult(data.validations)
      : ValidationStatus.UNDER_REVIEW,
    idTicket: event.idTicket,
    idUser: event.idUser,
    idProduct: event.idProduct,
    validations: data.validations,
    suggestions: data.suggestions,
    error: data.error
  };
};

const humanEventParser = (event: any): ProcessedEventData => {
  let result: ValidationStatus;
  if (event.result === 0) {
    result = ValidationStatus.REJECTED;
  } else if (event.result === 1) {
    result = ValidationStatus.APPROVED;
  } else {
    throw new Error("Invalid result");
  }

  return {
    statusCode: 200,
    origin: Validator.HUMAN,
    idTicket: event.idTicket,
    idUser: event.idUser,
    idProduct: event.idProduct,
    result,
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
