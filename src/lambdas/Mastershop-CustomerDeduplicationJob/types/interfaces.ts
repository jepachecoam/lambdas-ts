export interface CustomerAddress {
  full_name: string;
  first_name: string;
  last_name: string;
  country: string;
  country_code: string;
  state: string;
  city: string;
  phone: string;
  address1: string;
  address2: string;
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

export interface CustomerMatch {
  customer: Customer;
  score: number;
  matches: string[];
  fuzzyMatches: { field: string; score: number }[];
}

export interface QueryParams {
  conditions: string[];
  replacements: Record<string, any>;
}

export interface CustomerSearchResult {
  bestMatch: CustomerMatch;
  unmatchedValues: {
    idCustomer: number;
    data: Partial<ResolveIdCustomerRequest>;
  };
}

export interface ProcessCustomer {
  idCustomer: number;
  message: string;
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
