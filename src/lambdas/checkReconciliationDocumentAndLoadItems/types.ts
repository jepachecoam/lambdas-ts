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

export interface ICarrierCharge {
  idCarrierCharge: number;
  idCarrier: string;
  invoiceNumber: string;
  carrierTrackingCode: string;
  chargeDate: Date;
  units: number;
  actualWeight: number;
  volumetricWeight: number;
  billedWeight: number;
  declaredValue: number;
  fixedFreight: number;
  variableFreight: number;
  collectionCommission: number;
  totalFreight: number;
  businessUnit: string;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
  totalCharge?: number;
}

export interface ICarrierPayment {
  idCarrierPayment: number;
  idCarrier: number;
  carrierTrackingCode: string;
  collectionDate: Date;
  notes?: string;
  paymentMethod: string;
  amount: number;
  paymentDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
