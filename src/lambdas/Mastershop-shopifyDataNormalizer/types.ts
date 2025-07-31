export enum Envs {
  REDIS_HOST = "REDIS_HOST",
  REDIS_PORT = "REDIS_PORT",
  B2B_BASE_URL = "B2B_BASE_URL",
  API_KEY_MS = "API_KEY_MS",
  APP_NAME_MS = "APP_NAME_MS",
  REDIS_TTL_IN_MINUTES = "REDIS_TTL_IN_MINUTES",
  SLACK_URL_NOTIFICATION = "SLACK_URL_NOTIFICATION"
}

// Interfaces para objetos del API externa (Shopify)
export interface ShopifyAddress {
  city: string | null;
  address1: string | null;
  address2: string | null;
  latitude: number | null;
  longitude: number | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  phone: string | null;
  country: string | null;
  countryCode: string | null;
  province: string | null;
  provinceCode: string | null;
}

export interface ShopifyCustomer {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
}

export interface ShopifyCustomAttribute {
  key: string;
  value: string;
}

export interface ShopifyOrder {
  billingAddressMatchesShippingAddress: boolean;
  tags: string[];
  paymentGatewayNames: string[];
  note: string;
  customAttributes: ShopifyCustomAttribute[] | null;
  billingAddress: ShopifyAddress | null;
  shippingAddress: ShopifyAddress | null;
  customer: ShopifyCustomer | null;
}

// Interfaces para datos normalizados (camelCase)
export interface Address {
  zip: string | null;
  country: string;
  city: string;
  address1: string;
  address2: string | null;
  latitude: number | null;
  longitude: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  company: string | null;
  state: string;
  stateCode: string | null;
  countryCode: string;
}

export interface Customer {
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  documentType: string | null;
  documentNumber: string | null;
}

export interface NormalizedOrderOutput {
  billingAddress: Address;
  shippingAddress: Address;
  customer: Customer;
  notes: string[];
  tags: string[];
  paymentMethod: string;
}

export interface NormalizeOrderParams {
  orderId: number;
  accessToken: string;
  storeUrl: string;
}

export interface NormalizeOrderResult {
  success: boolean;
  message: string;
  data: any;
}

export interface ExtractedData {
  country: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  stateCode: string | null;
  documentType: string | null;
  documentNumber: string | null;
}

export interface CustomAttribute {
  key: string;
  value: string;
}
