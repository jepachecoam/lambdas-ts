import axios from "axios";

class Dao {
  private environmentName: string;

  constructor(environment: string) {
    this.environmentName = environment;
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
