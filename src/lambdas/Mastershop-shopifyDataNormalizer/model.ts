import Dao from "./dao";
import Dto from "./dto";
import { ShopifyDataSchema } from "./schema";
import { NormalizeOrderParams, NormalizeOrderResult } from "./types";
import { cleanHtmlEscapedContent, parseJsonIfNeeded } from "./utils";

class Model {
  private dataAccess: Dao;

  constructor(environment: string) {
    this.dataAccess = new Dao(environment);
  }

  async normalizeShopifyOrder(
    params: NormalizeOrderParams
  ): Promise<NormalizeOrderResult> {
    try {
      const orderData = await this.fetchOrderFromShopify(params);
      if (!orderData) {
        return {
          success: false,
          message: "Orden no encontrada en Shopify",
          data: null
        };
      }

      console.log("Shopify order", JSON.stringify(orderData, null, 2));

      const directResult = this.tryDirectNormalization(orderData);
      if (directResult.success) {
        return {
          success: true,
          message: "Normalización exitosa con DTO",
          data: directResult.data
        };
      }
      return { success: false, message: "No se pudo normalizar", data: null };

      // const cachedResult = await this.tryNormalizationWithCache(
      //   orderData,
      //   params.accessToken
      // );

      // if (cachedResult.success) {
      //   return {
      //     success: true,
      //     data: cachedResult.data,
      //     message: "Normalización con cache exitosa"
      //   };
      // }

      // const aiResult = await this.tryNormalizationWithAI(
      //   orderData,
      //   params.accessToken
      // );
      // return aiResult;
    } catch (error) {
      console.error("💥 [ERROR] Error normalizando orden de Shopify:", error);
      return {
        success: false,
        message: "Error interno procesando datos",
        data: null
      };
    }
  }

  private async fetchOrderFromShopify(params: NormalizeOrderParams) {
    console.log("🛍️ [SHOPIFY] Obteniendo datos de la orden:", params.orderId);
    const response = await this.dataAccess.fetchShopifyOrderById({
      orderId: params.orderId,
      accessToken: params.accessToken,
      storeUrl: params.storeUrl
    });
    return response?.data?.data?.order;
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
        order: orderSchemaExpected,
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
      const cached = await this.dataAccess.getCachedItem({ key: accessToken });
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("💥 [CACHE] Error obteniendo funciones cacheadas:", error);
      return null;
    }
  }

  private async generateNormalizationFunction(orderData: any): Promise<string> {
    const response =
      await this.dataAccess.generateNormalizationWithAI(orderData);
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

      await this.dataAccess.storeCachedItem({
        key: accessToken,
        value: JSON.stringify(existingFunctions)
      });
    } catch (error) {
      console.error("💥 [CACHE] Error guardando función:", error);
    }
  }
}

export default Model;
