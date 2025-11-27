import {
  AffiliationFieldsValidation,
  BasicFieldsValidation,
  Validation,
  ValidationFailure,
  ValidationStatus,
  ValidationType,
  VariantValidation
} from "./types";

const validateName = (name: string): Validation[] => {
  const failures: Validation[] = [];
  if (!name || name.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  if (name && /^\d+$/.test(name.trim())) {
    failures.push({
      key: ValidationFailure.IS_JUST_NUMERIC,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateDescription = (description: string): Validation[] => {
  const failures: Validation[] = [];
  if (!description || description.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  if (description && description.length < 200) {
    failures.push({
      key: ValidationFailure.IS_TOO_SHORT,
      type: ValidationType.REJECTED,
      minLength: 200
    });
  }
  return failures;
};

const validateImage = (urlImageProduct: string): Validation[] => {
  const failures: Validation[] = [];
  const imageUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  if (!urlImageProduct || urlImageProduct.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  if (urlImageProduct && !imageUrlPattern.test(urlImageProduct)) {
    failures.push({
      key: ValidationFailure.INVALID_FORMAT,
      type: ValidationType.REJECTED,
      whiteList: ["jpg", "jpeg", "png", "gif", "webp"]
    });
  }
  return failures;
};

// OPTIONAL
const validateSuggestedPrice = (suggestedPrice: number): Validation[] => {
  const failures: Validation[] = [];
  if (suggestedPrice <= 0) {
    failures.push({
      key: ValidationFailure.NOT_POSITIVE,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateWarrantyPhone = (warrantyPhone: string): Validation[] => {
  const failures: Validation[] = [];
  if (!warrantyPhone || warrantyPhone.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateSupportEmail = (supportEmail: string): Validation[] => {
  const failures: Validation[] = [];
  if (!supportEmail || supportEmail.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateWarrantyConditions = (
  warrantyConditions: string
): Validation[] => {
  const failures: Validation[] = [];
  if (!warrantyConditions || warrantyConditions.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateWarrantyPeriod = (warrantyPeriod: number): Validation[] => {
  const failures: Validation[] = [];
  if (!warrantyPeriod) {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validatePublicName = (publicName: string): Validation[] => {
  const failures: Validation[] = [];
  if (!publicName || publicName.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateProfileDescription = (description: string): Validation[] => {
  const failures: Validation[] = [];
  if (!description || description.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateProfileImage = (profileImage: string): Validation[] => {
  const failures: Validation[] = [];
  if (!profileImage || profileImage.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateWhatsapp = (whatsapp: string): Validation[] => {
  const failures: Validation[] = [];
  if (!whatsapp || whatsapp.trim() === "") {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateHasWhatsapp = (hasWhatsapp: number): Validation[] => {
  const failures: Validation[] = [];
  if (hasWhatsapp == null) {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

// VARIATIONS
const validateWeight = (weight: number): Validation[] => {
  const failures: Validation[] = [];
  if (weight == null) {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  if (weight < 0) {
    failures.push({
      key: ValidationFailure.IS_NEGATIVE,
      type: ValidationType.REJECTED
    });
  }
  if (weight > 1) {
    failures.push({
      key: ValidationFailure.EXCEEDS_LIMIT,
      type: ValidationType.UNDER_REVIEW
    });
  }
  return failures;
};

const validatePrice = (price: number): Validation[] => {
  const failures: Validation[] = [];
  if (price == null) {
    failures.push({
      key: ValidationFailure.IS_NULL,
      type: ValidationType.REJECTED
    });
  }
  if (price <= 0) {
    failures.push({
      key: ValidationFailure.NOT_POSITIVE,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

const validateStock = (stock: number): Validation[] => {
  const failures: Validation[] = [];
  if (stock <= 0) {
    failures.push({
      key: ValidationFailure.NOT_POSITIVE,
      type: ValidationType.REJECTED
    });
  }
  return failures;
};

// TOOLS
const validateRequiredFields = (event: any) => {
  const failures: string[] = [];
  if (!event.environment) failures.push("Environment is required");
  if (!event.idUser) failures.push("idUser is required");
  if (!event.idProduct) failures.push("idProduct is required");
  if (!event.idTicket) failures.push("idTicket is required");
  if (!event.idBusiness) failures.push("idBusiness is required");
  if (event.affiliationsActive == null) {
    failures.push("affiliationsActive is required");
  }

  return {
    failures,
    environment: event.environment,
    idProduct: event.idProduct,
    idTicket: event.idTicket,
    idBusiness: event.idBusiness,
    affiliationsActive: event.affiliationsActive
  };
};

const validateBasicFields = (event: any): BasicFieldsValidation => {
  const { name, description, urlImageProduct } = event;

  return {
    name: validateName(name),
    description: validateDescription(description),
    urlImageProduct: validateImage(urlImageProduct)
  };
};

const validateAffiliationFields = (
  event: any,
  publicProfile: any
): AffiliationFieldsValidation => {
  const validations = {} as AffiliationFieldsValidation;

  if (!publicProfile) {
    validations.publicProfile = [
      {
        key: ValidationFailure.IS_NULL,
        type: ValidationType.REJECTED
      }
    ];
    return validations;
  }

  const {
    suggestedPrice,
    warrantyPhone,
    supportEmail,
    warrantyConditions,
    warrantyPeriod
  } = event;

  const phoneFailures = validateWarrantyPhone(warrantyPhone);
  const emailFailures = validateSupportEmail(supportEmail);
  validations.warrantyContactInfo =
    phoneFailures.length > 0 && emailFailures.length > 0
      ? [
          {
            key: ValidationFailure.IS_NULL,
            type: ValidationType.REJECTED
          }
        ]
      : [];

  validations.suggestedPrice = validateSuggestedPrice(suggestedPrice);
  validations.warrantyConditions =
    validateWarrantyConditions(warrantyConditions);
  validations.warrantyPeriod = validateWarrantyPeriod(warrantyPeriod);

  validations.publicName = validatePublicName(publicProfile.publicName);
  validations.profileDescription = validateProfileDescription(
    publicProfile.description
  );
  validations.profileImage = validateProfileImage(publicProfile.profileImage);
  validations.whatsapp = validateWhatsapp(publicProfile.whatsapp);
  validations.hasWhatsapp = validateHasWhatsapp(publicProfile.hasWhatsapp);

  return validations;
};

const validateVariants = (variants: any[]): VariantValidation[] => {
  return variants.map((variant) => ({
    idVariant: variant.idVariant,
    price: validatePrice(variant.price),
    weight: validateWeight(variant.weight),
    stock: validateStock(variant.stock)
  }));
};

const determineResult = (validations: any): ValidationStatus => {
  const hasRejected = hasValidationType(validations, ValidationType.REJECTED);
  const hasUnderReview = hasValidationType(
    validations,
    ValidationType.UNDER_REVIEW
  );

  if (hasRejected) return ValidationStatus.REJECTED;
  if (hasUnderReview) return ValidationStatus.UNDER_REVIEW;
  return ValidationStatus.APPROVED;
};

const hasValidationType = (input: any, type: ValidationType): boolean => {
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
  validateRequiredFields,
  validateBasicFields,
  validateAffiliationFields,
  validateVariants,
  determineResult
};
