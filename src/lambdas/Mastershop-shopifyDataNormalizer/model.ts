import Dao from "./dao";
import Dto from "./dto";
import { ShopifyDataSchema } from "./schema";
import { NormalizeOrderParams, NormalizeOrderResult } from "./types";
import { cleanHtmlEscapedContent, parseJsonIfNeeded } from "./utils";

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
        data: processOrderResp.data
      };
    } catch (error) {
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

  private async tryNormalizationWithCache(
    orderData: any,
    accessToken: string
  ): Promise<{ success: boolean; data?: any }> {
    const cachedFunctions =
      await this.getCachedNormalizationFunctions(accessToken);

    if (!cachedFunctions || cachedFunctions.length === 0) {
      console.log("⚠️ [CACHE] No se encontraron funciones cacheadas");
      return { success: false };
    }

    console.log(
      "📋 [CACHE] Probando",
      cachedFunctions.length,
      "funciones cacheadas"
    );
    for (let i = 0; i < cachedFunctions.length; i++) {
      const result = this.executeNormalizationFunction(
        cachedFunctions[i],
        orderData
      );
      if (result.success) {
        console.log("✅ [CACHE] Función", i + 1, "ejecutada exitosamente");
        return { success: true, data: result.data };
      }
      console.log("❌ [CACHE] Función", i + 1, "falló");
    }

    console.log("❌ [CACHE] Ninguna función cacheada fue exitosa");
    return { success: false };
  }

  private async tryNormalizationWithAI(
    orderData: any,
    accessToken: string
  ): Promise<NormalizeOrderResult> {
    try {
      const aiFunction = await this.generateNormalizationFunction(orderData);

      const result = this.executeNormalizationFunction(aiFunction, orderData);

      if (result.success) {
        await this.saveNormalizationFunction(accessToken, aiFunction);
        return {
          success: true,
          data: result.data,
          message: "Normalizada Con AI"
        };
      }
      return { success: false, message: "Función de IA no válida", data: null };
    } catch (error) {
      console.error("💥 [AI ERROR] Error generando con IA:", error);
      return {
        success: false,
        message: "Error generando normalización con IA",
        data: null
      };
    }
  }

  private executeNormalizationFunction(functionCode: string, orderData: any) {
    try {
      const normalizationFunction = eval(`(${functionCode})`);
      const normalizedData = normalizationFunction(orderData);
      const validation = ShopifyDataSchema.safeParse(normalizedData);
      return {
        success: validation.success,
        data: normalizedData
      };
    } catch (error) {
      console.warn("⚠️ [EXEC] Error ejecutando función:", error);
      return { success: false };
    }
  }

  private async getCachedNormalizationFunctions(
    accessToken: string
  ): Promise<string[] | null> {
    try {
      const cached = await this.dao.getCachedItem({ key: accessToken });
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("💥 [CACHE] Error obteniendo funciones cacheadas:", error);
      return null;
    }
  }

  private async generateNormalizationFunction(orderData: any): Promise<string> {
    const response = await this.dao.generateNormalizationWithAI(orderData);
    const rawFunction = response.data.data || response.data;
    console.log("rawFunction", rawFunction);
    const cleanedFunction = cleanHtmlEscapedContent(rawFunction);
    return parseJsonIfNeeded(cleanedFunction);
  }

  private async saveNormalizationFunction(
    accessToken: string,
    functionCode: string
  ) {
    try {
      const existingFunctions =
        (await this.getCachedNormalizationFunctions(accessToken)) || [];
      existingFunctions.push(functionCode);

      await this.dao.storeCachedItem({
        key: accessToken,
        value: JSON.stringify(existingFunctions)
      });
    } catch (error) {
      console.error("💥 [CACHE] Error guardando función:", error);
    }
  }
}

export default Model;
