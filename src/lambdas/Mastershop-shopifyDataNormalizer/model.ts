import Dao from "./dao";
import Dto from "./dto";
import { ShopifyDataSchema } from "./schema";
import { NormalizeOrderParams } from "./types";

class Model {
  private dao: Dao;

  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async normalizeAndProcessOrder(params: any) {
    try {
      const orderData = await this.fetchOrderFromShopify(params);
      if (!orderData) {
        return {
          success: false,
          message: "No se pudo obtener la order de Shopify",
          data: null
        };
      }

      console.log(
        "OrderData From Shopify:>>>",
        JSON.stringify(orderData, null, 2)
      );

      const directResult = this.tryDirectNormalization(orderData);
      if (!directResult.success) {
        return { success: false, message: "No se pudo normalizar", data: null };
      }

      // 1. Armar body para primer endpoint getNormalizeProducts
      const normalizeProductsBody = Dto.buildNormalizeProductsBody(
        directResult.data,
        params.configTool
      );

      const normalizeProductsResp = await this.dao.postNormalizeProducts(
        normalizeProductsBody
      );

      // 2. Segundo body para process order
      const processOrderBody = Dto.buildProcessOrderBody(
        directResult.data,
        normalizeProductsResp.data,
        params.shopifyOrderId
      );

      const processOrderResp = await this.dao.postProcessOrder(
        processOrderBody,
        params.msApiKey
      );

      return {
        success: true,
        message: "Order processed successfully",
        data: {
          processOrderPayload: processOrderBody,
          processOrderResponse: processOrderResp.data
        }
      };
    } catch (error) {
      console.error("error", error);
      return {
        success: false,
        message: "Error en el procesamiento de la orden",
        data: error
      };
    }
  }

  private async fetchOrderFromShopify(params: NormalizeOrderParams) {
    try {
      console.log(
        "🛍️ [SHOPIFY] Obteniendo datos de la orden:",
        params.shopifyOrderId
      );
      const validatedStoreUrl = params.shopifyStoreUrl.startsWith("https://")
        ? params.shopifyStoreUrl
        : `https://${params.shopifyStoreUrl}`;

      const response = await this.dao.fetchShopifyOrderById({
        orderId: params.shopifyOrderId,
        accessToken: params.shopifyAccessToken,
        storeUrl: validatedStoreUrl
      });
      return response?.data?.data?.order;
    } catch (error) {
      console.error("💥 [ERROR] Error obteniendo orden de Shopify:", error);
      return null;
    }
  }

  private tryDirectNormalization(orderData: any) {
    const { data: normalizeOrderData, usedFallback } =
      Dto.normalizeOrderData(orderData);

    const { orderSchemaExpected, usedDefaultValuesInCriticalFields } =
      Dto.convertToOrderSchemaExpected(normalizeOrderData);

    const validation = ShopifyDataSchema.safeParse(orderSchemaExpected);

    return {
      success: validation.success,
      data: {
        order: validation.data,
        usedFallback,
        usedDefaultValuesInCriticalFields
      }
    };
  }
}

export default Model;
