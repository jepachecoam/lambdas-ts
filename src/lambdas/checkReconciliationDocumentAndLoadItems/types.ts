export type FieldType = "string" | "number" | "decimal" | "date" | "enum";

export interface ValidationRule {
  header: string;
  key: string;
  type: FieldType;
  required: boolean;
  enumValues?: string[];
  pattern?: RegExp;
}

export enum ConciliationTypes {
  payments = "payments",
  charges = "charges"
}

export enum Envs {
  SLACK_WEBHOOK_URL = "SLACK_WEBHOOK_URL",
  BATCH_SIZE = "BATCH_SIZE"
}
