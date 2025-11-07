import Model from "./model";
import {
  ValidationData,
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

// Tests
console.log("🧪 Testing Model.getObservations method\n");

const model = new Model("dev");

runTest("should return approval message for approved status", () => {
  const result = model.getObservations(ValidationStatus.APPROVED, {});
  const expected = `¡Enhorabuena! Tu producto ha sido aprobado con éxito. 
      Estamos aquí para apoyarte en cada paso del camino. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. 
      Importante: El producto ha sido habilitado para uso interno y/o de dropshippers, según la configuración actual. Si deseas modificar su visibilidad, puedes editarla desde la sección de configuración del producto. 
      ¡Adelante y mucho éxito en tus ventas!`;
  assertEqual(result, expected);
});

runTest("should return empty string for under review status", () => {
  const result = model.getObservations(ValidationStatus.UNDER_REVIEW, {});
  assertEqual(result, "");
});

runTest(
  "should return basic rejection message for rejected with no validations",
  () => {
    const result = model.getObservations(ValidationStatus.REJECTED, {});
    assertEqual(
      result,
      "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n"
    );
  }
);

runTest("should handle single field validation errors", () => {
  const validations: ValidationData = {
    name: [{ key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "nombre: El campo es obligatorio\n"
  );
});

runTest("should handle multiple field validation errors", () => {
  const validations: ValidationData = {
    name: [
      { key: ValidationFailure.IS_TOO_SHORT, type: ValidationType.REJECTED }
    ],
    description: [
      { key: ValidationFailure.INVALID_FORMAT, type: ValidationType.REJECTED }
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "nombre: El campo es demasiado corto\n" +
      "descripción: El campo tiene un formato inválido\n"
  );
});

runTest("should handle multiple errors in same field", () => {
  const validations: ValidationData = {
    price: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED },
      { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "precio: El campo es obligatorio, El campo debe ser mayor a cero\n"
  );
});

runTest("should handle variant validation errors", () => {
  const validations: ValidationData = {
    variants: [
      {
        idVariant: "var1",
        price: [
          { key: ValidationFailure.NOT_POSITIVE, type: ValidationType.REJECTED }
        ],
        weight: [
          { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
        ],
        stock: []
      } as VariantValidation
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "variante(var1) - precio: El campo debe ser mayor a cero\n" +
      "variante(var1) - peso: El campo es obligatorio\n"
  );
});

runTest("should handle multiple variants with errors", () => {
  const validations: ValidationData = {
    variants: [
      {
        idVariant: "var1",
        price: [
          { key: ValidationFailure.IS_NEGATIVE, type: ValidationType.REJECTED }
        ],
        weight: [],
        stock: []
      } as VariantValidation,
      {
        idVariant: "var2",
        price: [],
        weight: [
          {
            key: ValidationFailure.EXCEEDS_LIMIT,
            type: ValidationType.REJECTED
          }
        ],
        stock: [
          {
            key: ValidationFailure.IS_JUST_NUMERIC,
            type: ValidationType.REJECTED
          }
        ]
      } as VariantValidation
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "variante(var1) - precio: El campo debe ser mayor o igual a cero\n" +
      "variante(var2) - peso: El campo excede el límite\n" +
      "variante(var2) - stock: El campo debe ser numérico\n"
  );
});

runTest("should handle mixed field and variant errors", () => {
  const validations: ValidationData = {
    name: [
      {
        key: ValidationFailure.SEMANTIC_RELEVANCE,
        type: ValidationType.REJECTED
      }
    ],
    variants: [
      {
        idVariant: "var1",
        price: [
          {
            key: ValidationFailure.HAS_DIMENSIONS,
            type: ValidationType.REJECTED
          }
        ],
        weight: [],
        stock: []
      } as VariantValidation
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "nombre: El campo no es relevante semánticamente\n" +
      "variante(var1) - precio: El campo tiene dimensiones\n"
  );
});

runTest("should skip empty validation arrays", () => {
  const validations: ValidationData = {
    name: [],
    description: [
      { key: ValidationFailure.IS_NULL, type: ValidationType.REJECTED }
    ],
    category: []
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "descripción: El campo es obligatorio\n"
  );
});

runTest("should handle validations with whiteList", () => {
  const validations: ValidationData = {
    urlImageProduct: [
      {
        key: ValidationFailure.INVALID_FORMAT,
        type: ValidationType.REJECTED,
        whiteList: ["jpg", "png", "gif"]
      }
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "imagen del producto: El campo tiene un formato inválido (permitidos: jpg, png, gif)\n"
  );
});

runTest("should handle validations with minLength", () => {
  const validations: ValidationData = {
    description: [
      {
        key: ValidationFailure.IS_TOO_SHORT,
        type: ValidationType.REJECTED,
        minLength: 10
      }
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "descripción: El campo es demasiado corto (mínimo 10 caracteres)\n"
  );
});

runTest("should handle validations with both whiteList and minLength", () => {
  const validations: ValidationData = {
    name: [
      {
        key: ValidationFailure.INVALID_FORMAT,
        type: ValidationType.REJECTED,
        whiteList: ["admin", "user", "guest"],
        minLength: 5
      }
    ]
  };

  const result = model.getObservations(ValidationStatus.REJECTED, validations);
  assertEqual(
    result,
    "Lamentamos informarte que, tras la revisión, tu producto no ha sido aprobado en esta ocasión por las siguientes razones:\n" +
      "nombre: El campo tiene un formato inválido (permitidos: admin, user, guest) (mínimo 5 caracteres)\n"
  );
});

console.log("\n🎉 All tests completed!");
console.log("\n📋 Tests incluyen:");
console.log("✅ Validaciones básicas");
console.log("✅ Múltiples errores por campo");
console.log("✅ Validaciones de variantes");
console.log("✅ Validaciones con whiteList");
console.log("✅ Validaciones con minLength");
console.log("✅ Validaciones con ambas propiedades");
