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
            multipassIdentifier
            note
            numberOfOrders
            phone
            productSubscriberStatus
            state
            tags
            validEmailAddress
            verifiedEmail
            addresses {
              name
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
