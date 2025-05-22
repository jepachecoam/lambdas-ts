import { ValidationRule } from "./types";

/**
 * Convierte un número serial de Excel a una fecha real (UTC).
 */
function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const msPerDay = 86400 * 1000;
  const excelEpoch = new Date(Date.UTC(1970, 0, 1));
  const date = new Date(excelEpoch.getTime() + utcDays * msPerDay);

  // Construye fecha "plana" sin hora para evitar desfases
  const yyyy = date.getUTCFullYear();
  const mm = date.getUTCMonth();
  const dd = date.getUTCDate();

  return new Date(yyyy, mm, dd); // esta fecha es sin zona horaria y la deja tal cual como esta en excel.
}

/**
 * Limpia y convierte a número entero o decimal, considerando casos como:
 * - "$1,234.56"
 * - "1 000"
 */
function cleanNumber(value: any, isInteger = false): number | null {
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "").trim();
    const num = Number(cleaned);
    if (isNaN(num)) return null;
    return isInteger ? Math.floor(num) : num;
  }
  if (typeof value === "number") {
    return isInteger ? Math.floor(value) : value;
  }
  return null;
}

/**
 * Limpia espacios invisibles, tabulaciones y normaliza cadenas.
 */
function cleanString(value: any): string {
  if (typeof value !== "string") return String(value);
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Transforma el valor según el tipo definido en el esquema.
 */
function transformValue(cellValue: any, type: ValidationRule["type"]): any {
  if (cellValue === undefined || cellValue === null || cellValue === "") {
    return null;
  }

  switch (type) {
    case "number":
      return cleanNumber(cellValue, true);
    case "decimal":
      return cleanNumber(cellValue, false);
    case "date": {
      if (typeof cellValue === "number") {
        return excelSerialToDate(cellValue);
      }
      const parsed = new Date(cellValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    case "enum":
    case "string":
    default:
      return cleanString(cellValue);
  }
}

/**
 * Valida y transforma una fila de Excel en base al esquema definido.
 */
function validateRow(
  row: any[],
  headers: string[],
  schema: ValidationRule[],
  rowIndex: number
) {
  const rowErrors: string[] = [];
  const validValues: any[] = [];

  for (let i = 0; i < schema.length; i++) {
    const rule = schema[i];
    const header = headers[i];
    const rawCell = row[i + 1];

    if (rawCell?.error) {
      rowErrors.push(
        `Fila ${rowIndex}: El campo "${header}" tiene un error de fórmula (${rawCell.error})`
      );
      validValues.push(null);
      continue;
    }

    const cellValue = rawCell?.formula ? rawCell.result : rawCell;

    if (
      rule.required &&
      (cellValue === undefined || cellValue === null || cellValue === "")
    ) {
      rowErrors.push(`Fila ${rowIndex}: El campo "${header}" es obligatorio`);
      validValues.push(null);
      continue;
    }

    if (cellValue === undefined || cellValue === null || cellValue === "") {
      validValues.push(null);
      continue;
    }

    const transformed = transformValue(cellValue, rule.type);

    // Validación específica
    switch (rule.type) {
      case "number":
        if (transformed === null || !Number.isInteger(transformed)) {
          rowErrors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser un número entero`
          );
        }
        break;
      case "decimal":
        if (transformed === null || isNaN(transformed)) {
          rowErrors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser un número decimal`
          );
        }
        break;
      case "date":
        if (!(transformed instanceof Date) || isNaN(transformed.getTime())) {
          rowErrors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser una fecha válida`
          );
        }
        break;
      case "enum":
        if (!rule.enumValues?.includes(transformed)) {
          rowErrors.push(
            `Fila ${rowIndex}: El campo "${header}" debe ser uno de: ${rule.enumValues?.join(", ")}`
          );
        }
        break;
      case "string":
        if (rule.pattern && !rule.pattern.test(transformed)) {
          rowErrors.push(
            `Fila ${rowIndex}: El campo "${header}" tiene un formato inválido`
          );
        }
        break;
    }

    validValues.push(transformed);
  }

  return { rowErrors, validValues };
}

export default { validateRow };
