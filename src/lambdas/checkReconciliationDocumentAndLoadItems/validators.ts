import { ValidationRule } from "./types";

function validateRow(
  row: any[],
  headers: string[],
  schema: ValidationRule[],
  rowIndex: number
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < schema.length; i++) {
    const rule = schema[i];
    const cellValue = row[i + 1]; // porque row[0] es null en ExcelJS
    const header = headers[i];

    if (
      rule.required &&
      (cellValue === undefined || cellValue === null || cellValue === "")
    ) {
      errors.push(`Fila ${rowIndex}: El campo "${header}" es obligatorio`);
      continue;
    }

    if (cellValue === undefined || cellValue === null || cellValue === "") {
      continue;
    }

    switch (rule.type) {
      case "number":
        if (isNaN(Number(cellValue)) || !Number.isInteger(Number(cellValue))) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser un número entero`
          );
        }
        break;
      case "decimal":
        if (isNaN(Number(cellValue))) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser un número decimal`
          );
        }
        break;
      case "date":
        if (isNaN(Date.parse(cellValue))) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser una fecha válida`
          );
        }
        break;
      case "enum":
        if (!rule.enumValues?.includes(cellValue)) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser uno de: ${rule.enumValues?.join(", ")}`
          );
        }
        break;
      case "string":
        if (rule.pattern && !rule.pattern.test(cellValue)) {
          errors.push(
            `Fila ${rowIndex}: El campo "${header}" tiene un formato inválido`
          );
        }
        break;
    }
  }

  return errors;
}

export default { validateRow };
