export enum Envs {
  REDIS_HOST = "REDIS_HOST",
  REDIS_PORT = "REDIS_PORT",
  B2B_BASE_URL = "B2B_BASE_URL",
  API_KEY_MS = "API_KEY_MS",
  APP_NAME_MS = "APP_NAME_MS",
  REDIS_TTL_IN_MINUTES = "REDIS_TTL_IN_MINUTES",
  SLACK_URL_NOTIFICATION = "SLACK_URL_NOTIFICATION"
}

export interface IShopifyAddress {
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

export interface IShopifyCustomer {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  phone: string | null;
}

export interface IShopifyCustomAttribute {
  key: string;
  value: string;
}

export interface IShopifyVariant {
  price: string;
  id: string;
  inventoryItem: {
    measurement: {
      weight: {
        unit: string;
        value: number;
      };
    };
  };
}

export interface IShopifyProduct {
  id: string;
}

export interface IShopifyLineItem {
  title: string;
  quantity: number;
  variant: IShopifyVariant;
  product: IShopifyProduct;
}

export interface ILineItems {
  edges: {
    node: IShopifyLineItem;
  }[];
}

export interface IShopifyOrder {
  billingAddressMatchesShippingAddress: boolean;
  tags: string[] | null;
  paymentGatewayNames: string[] | null;
  note: string | null;
  customAttributes: IShopifyCustomAttribute[] | null;
  billingAddress: IShopifyAddress | null;
  shippingAddress: IShopifyAddress | null;
  customer: IShopifyCustomer | null;
  totalDiscounts: string | null;
  subtotalPrice: string | null;
  lineItems: ILineItems;
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

export interface IFallbackData {
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
