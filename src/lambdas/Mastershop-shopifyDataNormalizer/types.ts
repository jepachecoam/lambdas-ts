export enum Envs {
  SLACK_URL_NOTIFICATION = "SLACK_URL_NOTIFICATION"
}

export enum DisplayFinancialStatus {
  AUTHORIZED = "AUTHORIZED",
  EXPIRED = "EXPIRED",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
  VOIDED = "VOIDED"
}

export enum PaymentMethods {
  COD = "cod"
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
  totalPrice: string | null;
  totalShippingPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  lineItems: ILineItems;
  displayFinancialStatus: DisplayFinancialStatus;
}

export interface NormalizeOrderParams {
  shopifyOrderId: number;
  shopifyAccessToken: string;
  shopifyStoreUrl: string;
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
