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

export enum MATCH_WEIGHTS {
  PHONE = 35,
  EMAIL = 35,
  DOCUMENT = 40,
  EXTERNAL_PLATFORM_ID = 35,
  FULL_NAME = 20,
  FIRST_NAME = 8,
  LAST_NAME = 8,
  ADDRESS_STATE = 5,
  ADDRESS_CITY = 10
}

export enum MATCHING_CONFIG {
  MIN_MATCHES = 3,
  MIN_SCORE = 55
}

export interface ResolveIdCustomerRequest {
  idUser: number;
  idBusiness: number;
  externalId?: string | null;
  fullName: string;
  firstName: string;
  lastName?: string | null;
  tags?: any | null;
  email?: string | null;
  phone?: string | null;
  address?: any;
  documentType?: string | null;
  document?: string | null;
}

export interface Customer {
  idCustomer: number;
  idUser: number;
  idBussiness: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
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

export interface MatchResult {
  matches: string[];
  fuzzyMatches: { field: string; score: number }[];
  totalScore: number;
}

export interface BatchDeduplicationResult {
  processedBusinesses: number;
  duplicateGroups: number;
  mergedCustomers: number;
}
export interface DuplicateGroup {
  winner: Customer;
  duplicates: Customer[];
}
