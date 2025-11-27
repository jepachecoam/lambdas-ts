import {
  Validation,
  ValidationFailure,
  ValidationStatus,
  ValidationType,
  VariantValidation
} from "./types";

// Test runner simple
const runTest = (name: string, testFn: () => void) => {
  try {
    testFn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error}`);
  }
};

const assertEqual = (actual: any, expected: any, message?: string) => {
  if (actual !== expected) {
    throw new Error(
      `Expected ${expected}, got ${actual}${message ? ` - ${message}` : ""}`
    );
  }
};

// Función determineResult copiada del dto
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

console.log("🧪 Testing determineResult function with real examples\n");

// Casos APPROVED
runTest("All validations empty - APPROVED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [],
        weight: [],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.APPROVED);
});

runTest("Perfect product - APPROVED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    publicProfile: [],
    warrantyContactInfo: [],
    suggestedPrice: [],
    warrantyConditions: [],
    warrantyPeriod: [],
    publicName: [],
    profileDescription: [],
    profileImage: [],
    whatsapp: [],
    hasWhatsapp: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [],
        weight: [],
        stock: []
      },
      {
        idVariant: "VAR002",
        price: [],
        weight: [],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.APPROVED);
});

// Casos REJECTED
runTest("Basic field rejected - REJECTED", () => {
  const validations = {
    name: [{ key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }],
    description: [],
    urlImageProduct: []
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

runTest("Invalid image format - REJECTED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [
      { key: ValidationFailure.INVALID_FORMAT, type: ValidationType.REJECTED }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

runTest("Numeric name - REJECTED", () => {
  const validations = {
    name: [
      { key: ValidationFailure.IS_JUST_NUMERIC, type: ValidationType.REJECTED }
    ],
    description: [],
    urlImageProduct: []
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

runTest("Affiliation field rejected - REJECTED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    publicProfile: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    warrantyContactInfo: [],
    suggestedPrice: [],
    warrantyConditions: [],
    warrantyPeriod: [],
    publicName: [],
    profileDescription: [],
    profileImage: [],
    whatsapp: [],
    hasWhatsapp: []
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

runTest("Variant price rejected - REJECTED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [
          { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
        ],
        weight: [],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

runTest("Multiple variants with rejection - REJECTED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [],
        weight: [],
        stock: []
      },
      {
        idVariant: "VAR002",
        price: [
          { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
        ],
        weight: [],
        stock: [
          { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
        ]
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

// Casos UNDER_REVIEW
runTest("Weight exceeds limit - UNDER_REVIEW", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [],
        weight: [
          {
            key: ValidationFailure.EXCEEDS_LIMIT,
            type: ValidationType.UNDER_REVIEW
          }
        ],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.UNDER_REVIEW);
});

runTest("Description too short - UNDER_REVIEW", () => {
  const validations = {
    name: [],
    description: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.UNDER_REVIEW }
    ],
    urlImageProduct: []
  };
  assertEqual(determineResult(validations), ValidationStatus.UNDER_REVIEW);
});

// Casos con prioridad REJECTED sobre UNDER_REVIEW
runTest("Both rejected and under review - REJECTED wins", () => {
  const validations = {
    name: [{ key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }],
    description: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.UNDER_REVIEW }
    ],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [],
        weight: [
          {
            key: ValidationFailure.EXCEEDS_LIMIT,
            type: ValidationType.UNDER_REVIEW
          }
        ],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

runTest("Rejected in variants, under review in basic - REJECTED wins", () => {
  const validations = {
    name: [],
    description: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.UNDER_REVIEW }
    ],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [
          { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
        ],
        weight: [],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

// Casos complejos reales
runTest("Complete product with affiliation issues - REJECTED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    publicProfile: [],
    warrantyContactInfo: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    suggestedPrice: [
      { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
    ],
    warrantyConditions: [],
    warrantyPeriod: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    publicName: [],
    profileDescription: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    profileImage: [],
    whatsapp: [],
    hasWhatsapp: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [],
        weight: [
          {
            key: ValidationFailure.EXCEEDS_LIMIT,
            type: ValidationType.UNDER_REVIEW
          }
        ],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.REJECTED);
});

runTest("Image has dimensions issue - UNDER_REVIEW", () => {
  const validations = {
    name: [],
    category: [],
    description: [],
    urlImageProduct: [{ key: "hasDimensions", type: "underReview" }]
  };
  assertEqual(determineResult(validations), ValidationStatus.UNDER_REVIEW);
});

runTest("Product with only weight concerns - UNDER_REVIEW", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    publicProfile: [],
    warrantyContactInfo: [],
    suggestedPrice: [],
    warrantyConditions: [],
    warrantyPeriod: [],
    publicName: [],
    profileDescription: [],
    profileImage: [],
    whatsapp: [],
    hasWhatsapp: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [],
        weight: [
          {
            key: ValidationFailure.EXCEEDS_LIMIT,
            type: ValidationType.UNDER_REVIEW
          }
        ],
        stock: []
      },
      {
        idVariant: "VAR002",
        price: [],
        weight: [],
        stock: []
      }
    ]
  };
  assertEqual(determineResult(validations), ValidationStatus.UNDER_REVIEW);
});

// Casos edge
runTest("Empty object - APPROVED", () => {
  assertEqual(determineResult({}), ValidationStatus.APPROVED);
});

runTest("Null validations - APPROVED", () => {
  assertEqual(determineResult(null), ValidationStatus.APPROVED);
});

runTest("Only empty arrays - APPROVED", () => {
  const validations = {
    name: [],
    description: [],
    urlImageProduct: [],
    variants: []
  };
  assertEqual(determineResult(validations), ValidationStatus.APPROVED);
});

console.log("\n🎉 All determineResult tests completed!");
console.log("\n📊 Cobertura de casos:");
console.log("✅ Casos APPROVED (sin errores)");
console.log("✅ Casos REJECTED (errores críticos)");
console.log("✅ Casos UNDER_REVIEW (requieren revisión)");
console.log("✅ Prioridad REJECTED sobre UNDER_REVIEW");
console.log("✅ Validaciones en campos básicos");
console.log("✅ Validaciones en campos de afiliación");
console.log("✅ Validaciones en variantes");
console.log("✅ Casos complejos con múltiples tipos");
console.log("✅ Casos edge (objetos vacíos, null)");
