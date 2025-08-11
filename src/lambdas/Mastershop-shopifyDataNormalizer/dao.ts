import axios from "axios";

import CacheDB from "../../shared/databases/cache";
import { b2bRequest } from "../../shared/services/httpRequest";
import { prompt } from "./utils";

class Dao {
  private cacheDatabase: CacheDB;
  private environmentName: string;

  constructor(environment: string) {
    this.cacheDatabase = CacheDB.getInstance(environment);
    this.environmentName = environment;
  }

  async storeCachedItem({ key, value }: { key: string; value: string }) {
    return this.cacheDatabase.set({
      key,
      value,
      expireInSeconds: Number(process.env["REDIS_TTL_IN_MINUTES"]) * 60
    });
  }

  async getCachedItem({ key }: { key: string }) {
    return this.cacheDatabase.get({ key });
  }

  async generateNormalizationWithAI(orderData: any) {
    const requestPayload = {
      prompt: prompt(orderData),
      modelTier: "advanced",
      maxTokens: 10000,
      service: "text"
    };
    return b2bRequest.post(
      `/${this.environmentName}/api/b2b/tools/mastershopai`,
      requestPayload
    );
  }

  async postNormalizeProducts(body: any) {
    return axios.post(
      "https://5cowkssv0f.execute-api.us-east-1.amazonaws.com/newProd/integration/connectool/getNormalizeProducts",
      body
    );
  }

  async postProcessOrder(body: any, msApiKey: string) {
    return axios.post(
      "https://l7tmtzztq1.execute-api.us-east-1.amazonaws.com/qa/logistics/order/process",
      body,
      {
        headers: {
          "MS-API-KEY": msApiKey,
          "Content-Type": "application/json"
        }
      }
    );
  }

  async fetchShopifyOrderById({
    storeUrl,
    accessToken,
    orderId
  }: {
    storeUrl: string;
    accessToken: string;
    orderId: number;
  }) {
    const graphqlQuery = `
      query Order {
        order(id: "gid://shopify/Order/${orderId}") {
          billingAddressMatchesShippingAddress
          tags
          totalPrice
          totalDiscounts
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
