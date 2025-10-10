import { dbEnv } from "../../shared/types/database";

export const countryPhoneCodes = [
  "1", // Estados Unidos, Canadá
  "52", // México
  "54", // Argentina
  "55", // Brasil
  "56", // Chile
  "57", // Colombia
  "58", // Venezuela
  "51", // Perú
  "593", // Ecuador
  "591", // Bolivia
  "595", // Paraguay
  "598" // Uruguay
];

export type CustomerDeduplicationEnvs = Record<keyof typeof dbEnv, string> & {
  ENVIRONMENT: string;
};

export interface Customer {
  idCustomer: number;
  idUser: number;
  idBussiness: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string | null;
  defaultAddress: any;
  tags?: any;
  documentType?: string | null;
  document?: string | null;
  inBlackList?: number;
  dateInBlackList?: string | null;
  createdAt?: string;
  updatedAt?: string;
  externalId?: string | null;
}

export interface DuplicateGroup {
  winner: Customer;
  duplicates: Customer[];
}
