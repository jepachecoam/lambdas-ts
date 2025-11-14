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
  HAS_ERROR = "hasError",
  IS_BLACK_LISTED = "isBlacklisted"
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

enum TicketStatus {
  IN_PROGRESS = "inProgress",
  ON_HOLD = "onHold",
  COMPLETED = "completed"
}

interface UpdateProductValidationProcessParams {
  lastValidator?: Validator;
  status?: ValidationStatus;
  validations?: ValidationData;
  suggestions?: SuggestionData;
  humanComments?: string;
}

interface ValidationData {
  [key: string]: Validation[] | VariantValidation[];
}

interface SuggestionData {
  category?: {
    id: number;
    label: string;
  }[];
}

interface InputEvent {
  environment: string;
  idTicket: number;
  idProduct: number;
  idUser: number;
  basicValidationResult?: any;
  aiValidationResult?: any;
}

interface ProcessedEventData {
  statusCode: number;
  origin: Validator;
  idTicket: number;
  idProduct: number;
  idUser: number;
  result: ValidationStatus;
  validations: ValidationData;
  suggestions: SuggestionData;
  note?: string;
  error?: string;
}

interface UniqueIdOptions {
  prefix?: string;
  variableLength?: number;
  characters?: string;
}

export {
  InputEvent,
  ProcessedEventData,
  SuggestionData,
  TicketStatus,
  UpdateProductValidationProcessParams,
  Validation,
  ValidationData,
  ValidationFailure,
  ValidationStatus,
  ValidationType,
  Validator,
  VariantValidation,
  UniqueIdOptions
};
