enum ValidationFailure {
  IS_NULL = "isNull",
  IS_JUST_NUMERIC = "isJustNumeric",
  IS_TOO_SHORT = "isTooShort",
  INVALID_FORMAT = "invalidFormat",
  NOT_POSITIVE = "notPositive",
  IS_NEGATIVE = "isNegative",
  EXCEEDS_LIMIT = "exceedsLimit",
  HAS_DIMENSIONS = "hasDimensions",
  SEMANTIC_RELEVANCE = "semanticRelevance",
  HAS_ERROR = "hasError"
}

interface Validation {
  key: ValidationFailure;
  type: ValidationType;
  whiteList?: string[];
  minLength?: number;
}

enum ValidationType {
  REJECTED = "rejected",
  UNDER_REVIEW = "underReview"
}

interface BasicFieldsValidation {
  name: Validation[];
  description: Validation[];
  urlImageProduct: Validation[];
}

interface AffiliationFieldsValidation {
  publicProfile: Validation[];
  warrantyContactInfo: Validation[];
  suggestedPrice: Validation[];
  warrantyConditions: Validation[];
  warrantyPeriod: Validation[];
  publicName: Validation[];
  profileDescription: Validation[];
  profileImage: Validation[];
  whatsapp: Validation[];
  hasWhatsapp: Validation[];
}

interface VariantValidation {
  idVariant: string;
  price: Validation[];
  weight: Validation[];
  stock: Validation[];
}

enum Validator {
  CODE = "code",
  AI = "ai",
  HUMAN = "human"
}

enum ValidationStatus {
  APPROVED = "approved",
  REJECTED = "rejected",
  UNDER_REVIEW = "underReview",
  PROCESSING = "processing"
}

interface InputEvent {
  idProduct: number;
  idTicket: number;
  idBusiness: number;
  idUser: number;
  idProdFormat: number;
  name: string;
  description: string;
  urlImageProduct: string;
  affiliationsActive: boolean;
  environment: string;
}

interface CreateProductValidationProcessParams {
  idProduct: number;
  idTicket: number;
  lastValidator: Validator;
  status: ValidationStatus;
  validations?: any;
  suggestions?: any;
}

enum TicketStatus {
  IN_PROGRESS = "inProgress",
  ON_HOLD = "onHold",
  COMPLETED = "completed"
}

export {
  AffiliationFieldsValidation,
  BasicFieldsValidation,
  CreateProductValidationProcessParams,
  InputEvent,
  TicketStatus,
  Validation,
  ValidationFailure,
  ValidationStatus,
  ValidationType,
  Validator,
  VariantValidation
};
