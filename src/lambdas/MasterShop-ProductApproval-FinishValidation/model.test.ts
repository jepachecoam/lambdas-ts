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
      "Nombre: Es obligatorio\n"
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
      "Nombre: Es demasiado corto\n" +
      "Descripción: Tiene un formato inválido\n"
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
      "Precio: Es obligatorio\n"
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
      "Variante(var1) - Precio: Debe ser mayor a cero\n" +
      "Variante(var1) - Peso: Es obligatorio\n"
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
      "Variante(var1) - Precio: Debe ser mayor o igual a cero\n" +
      "Variante(var2) - Peso: Excede el límite\n" +
      "Variante(var2) - Stock: No puede contener solo números\n"
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
      "Nombre: No coincide con los demás datos\n" +
      "Variante(var1) - Precio: Tiene dimensiones\n"
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
      "Descripción: Es obligatorio\n"
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
      "Imagen del producto: Tiene un formato inválido (permitidos: jpg, png, gif)\n"
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
      "Descripción: Es demasiado corto (mínimo 10 caracteres)\n"
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
      "Nombre: Tiene un formato inválido (permitidos: admin, user, guest) (mínimo 5 caracteres)\n"
  );
});

// runTest("TEST", () => {
//   const validations: ValidationData = {
//     process: [{ key: "hasError", type: "underReview" }]
//   } as any;

//   const result = model.getObservations(
//     ValidationStatus.UNDER_REVIEW,
//     validations
//   );
//   console.log(result);
// });

console.log("\n🎉 All tests completed!");
console.log("\n📋 Tests incluyen:");
console.log("✅ Validaciones básicas");
console.log("✅ Múltiples errores por campo");
console.log("✅ Validaciones de variantes");
console.log("✅ Validaciones con whiteList");
console.log("✅ Validaciones con minLength");
console.log("✅ Validaciones con ambas propiedades");
