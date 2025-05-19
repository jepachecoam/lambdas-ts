export type FieldType = "string" | "number" | "decimal" | "date" | "enum";

export interface ValidationRule {
  header: string;
  key: string;
  type: FieldType;
  required: boolean;
  enumValues?: string[];
  pattern?: RegExp;
}

export enum conciliationTypes {
  payments = "payments",
  charges = "charges"
}
