import {
  Validation,
  ValidationFailure,
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

// Tests específicos para hasValidationType con objetos
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

console.log("🧪 Testing hasValidationType function with object handling\n");

// Tests para objetos directos
runTest("object with rejected validations", () => {
  const obj = {
    field1: [{ key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }],
    field2: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.UNDER_REVIEW }
    ]
  };
  assertEqual(hasValidationType(obj, ValidationType.REJECTED), true);
  assertEqual(hasValidationType(obj, ValidationType.UNDER_REVIEW), true);
});

runTest("nested object with validations", () => {
  const obj = {
    level1: {
      field1: [
        { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
      ]
    },
    level2: {
      field2: [
        {
          key: ValidationFailure.EXCEEDS_LIMIT,
          type: ValidationType.UNDER_REVIEW
        }
      ]
    }
  };
  assertEqual(hasValidationType(obj, ValidationType.REJECTED), true);
  assertEqual(hasValidationType(obj, ValidationType.UNDER_REVIEW), true);
});

runTest("object with variant validations", () => {
  const obj = {
    variants: [
      {
        idVariant: "1",
        price: [
          { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
        ],
        weight: [],
        stock: []
      }
    ]
  };
  assertEqual(hasValidationType(obj, ValidationType.REJECTED), true);
  assertEqual(hasValidationType(obj, ValidationType.UNDER_REVIEW), false);
});

runTest("object with mixed content", () => {
  const obj = {
    field1: "string",
    field2: 42,
    field3: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.UNDER_REVIEW }
    ],
    field4: []
  };
  assertEqual(hasValidationType(obj, ValidationType.UNDER_REVIEW), true);
  assertEqual(hasValidationType(obj, ValidationType.REJECTED), false);
});

runTest("empty object", () => {
  assertEqual(hasValidationType({}, ValidationType.REJECTED), false);
});

runTest("object with null values", () => {
  const obj = {
    field1: null,
    field2: [{ key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }]
  };
  assertEqual(hasValidationType(obj, ValidationType.REJECTED), true);
});

// Tests con objetos reales de la lambda
runTest("BasicFieldsValidation real structure", () => {
  const basicValidations = {
    name: [{ key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }],
    description: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.REJECTED }
    ],
    urlImageProduct: []
  };
  assertEqual(
    hasValidationType(basicValidations, ValidationType.REJECTED),
    true
  );
  assertEqual(
    hasValidationType(basicValidations, ValidationType.UNDER_REVIEW),
    false
  );
});

runTest("AffiliationFieldsValidation real structure", () => {
  const affiliationValidations = {
    publicProfile: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    warrantyContactInfo: [],
    suggestedPrice: [
      { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
    ],
    warrantyConditions: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    warrantyPeriod: [],
    publicName: [],
    profileDescription: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    profileImage: [],
    whatsapp: [],
    hasWhatsapp: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ]
  };
  assertEqual(
    hasValidationType(affiliationValidations, ValidationType.REJECTED),
    true
  );
});

runTest("Complete validation structure from lambda", () => {
  const completeValidations = {
    name: [
      { key: ValidationFailure.IS_JUST_NUMERIC, type: ValidationType.REJECTED }
    ],
    description: [],
    urlImageProduct: [
      { key: ValidationFailure.INVALID_FORMAT, type: ValidationType.REJECTED }
    ],
    publicProfile: [],
    warrantyContactInfo: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    suggestedPrice: [],
    warrantyConditions: [],
    warrantyPeriod: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    publicName: [],
    profileDescription: [],
    profileImage: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    whatsapp: [],
    hasWhatsapp: [],
    variants: [
      {
        idVariant: "VAR001",
        price: [
          { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
        ],
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
        weight: [
          { key: ValidationFailure.IS_NEGATIVE, type: ValidationType.REJECTED }
        ],
        stock: [
          { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
        ]
      }
    ]
  };
  assertEqual(
    hasValidationType(completeValidations, ValidationType.REJECTED),
    true
  );
  assertEqual(
    hasValidationType(completeValidations, ValidationType.UNDER_REVIEW),
    true
  );
});

// Casos edge específicos
runTest("Only basic validations without affiliations", () => {
  const basicOnly = {
    name: [],
    description: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.REJECTED }
    ],
    urlImageProduct: []
  };
  assertEqual(hasValidationType(basicOnly, ValidationType.REJECTED), true);
  assertEqual(hasValidationType(basicOnly, ValidationType.UNDER_REVIEW), false);
});

runTest("Only variants with validations", () => {
  const variantsOnly = {
    variants: [
      {
        idVariant: "V1",
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
  assertEqual(
    hasValidationType(variantsOnly, ValidationType.UNDER_REVIEW),
    true
  );
  assertEqual(hasValidationType(variantsOnly, ValidationType.REJECTED), false);
});

runTest("All empty validations", () => {
  const allEmpty = {
    name: [],
    description: [],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "V1",
        price: [],
        weight: [],
        stock: []
      }
    ]
  };
  assertEqual(hasValidationType(allEmpty, ValidationType.REJECTED), false);
  assertEqual(hasValidationType(allEmpty, ValidationType.UNDER_REVIEW), false);
});

runTest("Mixed validation types in same structure", () => {
  const mixed = {
    name: [{ key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }],
    description: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.UNDER_REVIEW }
    ],
    urlImageProduct: [],
    variants: [
      {
        idVariant: "V1",
        price: [
          { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
        ],
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
  assertEqual(hasValidationType(mixed, ValidationType.REJECTED), true);
  assertEqual(hasValidationType(mixed, ValidationType.UNDER_REVIEW), true);
});

runTest("Validation with extra properties", () => {
  const withExtras = {
    name: [
      {
        key: ValidationFailure.INVALID_FORMAT,
        type: ValidationType.REJECTED,
        whiteList: ["jpg", "png"],
        minLength: 10
      }
    ],
    description: []
  };
  assertEqual(hasValidationType(withExtras, ValidationType.REJECTED), true);
});

runTest("Deep nesting edge case", () => {
  const deepNested = {
    level1: {
      level2: {
        level3: {
          variants: [
            {
              idVariant: "DEEP1",
              price: [
                {
                  key: ValidationFailure.IS_NULL,
                  type: ValidationType.REJECTED
                }
              ],
              weight: [],
              stock: []
            }
          ]
        }
      }
    }
  };
  assertEqual(hasValidationType(deepNested, ValidationType.REJECTED), true);
});

console.log("\n🎉 All hasValidationType tests completed!");
console.log("\n📊 Cobertura de casos:");
console.log("✅ Objetos con validaciones directas");
console.log("✅ Objetos anidados con validaciones");
console.log("✅ Objetos con variant validations");
console.log("✅ Objetos con contenido mixto");
console.log("✅ Casos edge (objetos vacíos, valores null)");
console.log("✅ Estructuras reales de BasicFieldsValidation");
console.log("✅ Estructuras reales de AffiliationFieldsValidation");
console.log("✅ Estructuras completas de validación");
console.log("✅ Casos edge específicos del sistema");
console.log("✅ Validaciones con propiedades extra");
console.log("✅ Anidación profunda");
