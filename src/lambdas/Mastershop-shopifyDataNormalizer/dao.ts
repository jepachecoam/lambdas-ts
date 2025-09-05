import axios from "axios";

import { IShopifyOrder } from "./types";

class Dao {
  private environmentName: string;

  constructor(environment: string) {
    this.environmentName = environment;
  }

  async normalizeItems(body: any) {
    try {
      const response = await axios.post(
        `${process.env["URL_API_NORMALIZE_PRODUCTS"]}`,
        body
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error(
        "💥 [ERROR] Error en la normalización de productos:",
        error
      );
      const message = error?.response?.data?.message;
      return {
        success: false,
        data: message ? message : error
      };
    }
  }

  async postProcessOrder(body: any, msApiKey: string) {
    try {
      const response = await axios.post(
        `https://l7tmtzztq1.execute-api.us-east-1.amazonaws.com/${this.environmentName}/logistics/order/process`,
        body,
        {
          headers: {
            "MS-API-KEY": msApiKey,
            "Content-Type": "application/json"
          }
        }
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error("💥 [ERROR] Error en el procesamiento de la orden:", error);
      return {
        success: false,
        data: error
      };
    }
  }

  async fetchShopifyOrderById({
    storeUrl,
    accessToken,
    orderId
  }: {
    storeUrl: string;
    accessToken: string;
    orderId: number;
  }): Promise<{ data: { data: { order: IShopifyOrder } } }> {
    const graphqlQuery = `
      query Order {
        order(id: "gid://shopify/Order/${orderId}") {
          billingAddressMatchesShippingAddress
          tags
          totalPrice
          totalDiscounts
          displayFinancialStatus
          paymentGatewayNames
          note
          customAttributes {
            key
            value
          }
          billingAddress {
            city
            address1
            address2
            latitude
            longitude
            firstName
            lastName
            name
            company
            phone
            country
            countryCode
            province
            provinceCode
          }
          shippingAddress {
            city
            address1
            address2
            latitude
            longitude
            firstName
            lastName
            name
            company
            phone
            country
            countryCode
            province
            provinceCode
          }
          customer {
            email
            firstName
            lastName
            displayName
            phone
          }
          totalShippingPriceSet {
            shopMoney {
                amount
                currencyCode
          }
        }
          lineItems(first: 250) {
            edges {
                node {
                    title
                    quantity
                    variant {
                        price
                        id
                        inventoryItem {
                            measurement {
                                weight {
                                    unit
                                    value
                                }
                            }
                        }
                    }
                    product {
                        id
                    }
                    discountAllocations {
                        allocatedAmount {
                            amount
                            currencyCode
                        }
                    }
                }
            }
          }
        }
      }
    `;

    return axios.post(
      `${storeUrl}/admin/api/2025-07/graphql.json`,
      { query: graphqlQuery },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      }
    );
  }
}

export default Dao;
