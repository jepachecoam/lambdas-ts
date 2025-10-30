import Dao from "./dao";
import Dto from "./dto";
import {
  APPROVAL_THRESHOLDS,
  ApprovalStatus,
  BedrockImageAnalysis,
  ImageApprovalResponse,
  ProductApprovalRequest
} from "./types";

class Model {
  private dao: Dao = new Dao();

  processProductApproval = async ({
    imageUrl,
    name,
    category,
    description
  }: ProductApprovalRequest) => {
    console.log("🚀 Starting product approval process");
    const approvalResponse = Dto.createDefaultApprovalResponse();

    let finalApprovalResult = ApprovalStatus.APPROVED;
    let finalApprovalNote = "Product approved";

    // Step 1: Analyze image
    console.log("📸 Analyzing image...");
    const imageAnalysisResponse =
      await this.performCompleteImageAnalysis(imageUrl);
    approvalResponse.imageResult = imageAnalysisResponse.imageResult;
    console.log(`📸 Image analysis complete: ${imageAnalysisResponse.result}`);

    if (imageAnalysisResponse.result === ApprovalStatus.REJECTED) {
      finalApprovalResult = ApprovalStatus.REJECTED;
      finalApprovalNote = imageAnalysisResponse.note;
    } else if (imageAnalysisResponse.result === ApprovalStatus.UNDER_REVIEW) {
      finalApprovalResult = ApprovalStatus.UNDER_REVIEW;
      finalApprovalNote = imageAnalysisResponse.note;
    }

    // Step 2: If image is approved, proceed with text analysis
    if (imageAnalysisResponse.result === ApprovalStatus.APPROVED) {
      console.log("📝 Analyzing name...");
      // Analyze name
      const nameAnalysisResult = await this.dao.performNameAnalysis(
        imageAnalysisResponse.imageResult.description,
        name,
        this.buildNameAnalysisToolConfig()
      );
      approvalResponse.nameResult = nameAnalysisResult;
      console.log(
        `📝 Name analysis: relevance=${nameAnalysisResult.semanticRelevance}, rejected=${nameAnalysisResult.shouldBeRejected}`
      );

      if (nameAnalysisResult.shouldBeRejected) {
        finalApprovalResult = ApprovalStatus.REJECTED;
        finalApprovalNote = "Name contains prohibited content";
      } else if (
        nameAnalysisResult.semanticRelevance <
        APPROVAL_THRESHOLDS.SEMANTIC_RELEVANCE_MIN
      ) {
        finalApprovalResult = ApprovalStatus.REJECTED;
        finalApprovalNote = "Name has no semantic relevance with image";
      } else if (
        nameAnalysisResult.semanticRelevance >=
          APPROVAL_THRESHOLDS.SEMANTIC_RELEVANCE_MIN &&
        nameAnalysisResult.semanticRelevance <
          APPROVAL_THRESHOLDS.SEMANTIC_RELEVANCE_LOW
      ) {
        if (finalApprovalResult !== ApprovalStatus.REJECTED) {
          finalApprovalResult = ApprovalStatus.UNDER_REVIEW;
          finalApprovalNote =
            "Name has low semantic relevance, requires human review";
        }
      } else if (
        nameAnalysisResult.weight > APPROVAL_THRESHOLDS.WEIGHT_LIMIT_KG ||
        nameAnalysisResult.hasDimensions
      ) {
        if (finalApprovalResult !== ApprovalStatus.REJECTED) {
          finalApprovalResult = ApprovalStatus.UNDER_REVIEW;
          finalApprovalNote = "Name contains weight/dimensions";
        }
      }

      console.log("🏷️ Analyzing category...");
      // Analyze category
      const categoryAnalysisResult = await this.dao.performCategoryAnalysis(
        imageAnalysisResponse.imageResult.description,
        category,
        this.buildCategoryAnalysisToolConfig()
      );
      approvalResponse.categoryResult = categoryAnalysisResult;
      console.log(
        `🏷️ Category analysis: relevance=${categoryAnalysisResult.semanticRelevance}`
      );

      console.log("📄 Analyzing description...");
      // Analyze description
      const descriptionAnalysisResult =
        await this.dao.performDescriptionAnalysis(
          imageAnalysisResponse.imageResult.description,
          description,
          this.buildDescriptionAnalysisToolConfig()
        );
      approvalResponse.descriptionResult = descriptionAnalysisResult;
      console.log(
        `📄 Description analysis: relevance=${descriptionAnalysisResult.semanticRelevance}, rejected=${descriptionAnalysisResult.shouldBeRejected}`
      );

      if (descriptionAnalysisResult.shouldBeRejected) {
        finalApprovalResult = ApprovalStatus.REJECTED;
        finalApprovalNote = "Description contains prohibited content";
      } else if (
        descriptionAnalysisResult.semanticRelevance <
        APPROVAL_THRESHOLDS.SEMANTIC_RELEVANCE_MIN
      ) {
        finalApprovalResult = ApprovalStatus.REJECTED;
        finalApprovalNote = "Description has no semantic relevance with image";
      } else if (
        descriptionAnalysisResult.semanticRelevance >=
          APPROVAL_THRESHOLDS.SEMANTIC_RELEVANCE_MIN &&
        descriptionAnalysisResult.semanticRelevance <
          APPROVAL_THRESHOLDS.SEMANTIC_RELEVANCE_LOW
      ) {
        if (finalApprovalResult !== ApprovalStatus.REJECTED) {
          finalApprovalResult = ApprovalStatus.UNDER_REVIEW;
          finalApprovalNote =
            "Description has low semantic relevance, requires human review";
        }
      } else if (
        descriptionAnalysisResult.weight >
          APPROVAL_THRESHOLDS.WEIGHT_LIMIT_KG ||
        descriptionAnalysisResult.hasDimensions
      ) {
        if (finalApprovalResult !== ApprovalStatus.REJECTED) {
          finalApprovalResult = ApprovalStatus.UNDER_REVIEW;
          finalApprovalNote = "Description contains weight/dimensions";
        }
      }
    }

    approvalResponse.result = finalApprovalResult;
    approvalResponse.note = finalApprovalNote;

    console.log(
      `✅ Final approval result: ${finalApprovalResult} - ${finalApprovalNote}`
    );
    return approvalResponse;
  };

  determineImageApprovalStatus = (imageAnalysis: BedrockImageAnalysis) => {
    const shouldBeRejected = imageAnalysis.isProhibited;

    const shouldBeReviewed =
      !shouldBeRejected &&
      (imageAnalysis.weightKg > APPROVAL_THRESHOLDS.WEIGHT_LIMIT_KG ||
        imageAnalysis.hasDimensions);

    if (shouldBeRejected) {
      return {
        result: ApprovalStatus.REJECTED,
        note: imageAnalysis.prohibitedReason || "Prohibited content detected",
        shouldBeRejected: true,
        shouldBeReviewed: false
      };
    }

    if (shouldBeReviewed) {
      const reasons = [];
      if (imageAnalysis.weightKg > APPROVAL_THRESHOLDS.WEIGHT_LIMIT_KG) {
        reasons.push(
          `Weight over ${APPROVAL_THRESHOLDS.WEIGHT_LIMIT_KG}kg: ${imageAnalysis.weightKg}kg`
        );
      }
      if (imageAnalysis.hasDimensions) reasons.push("Dimensions detected");

      return {
        result: ApprovalStatus.UNDER_REVIEW,
        note: reasons.join(", "),
        shouldBeRejected: false,
        shouldBeReviewed: true
      };
    }

    return {
      result: ApprovalStatus.APPROVED,
      note: "Image approved",
      shouldBeRejected: false,
      shouldBeReviewed: false
    };
  };

  performCompleteImageAnalysis = async (
    imageUrl: string
  ): Promise<ImageApprovalResponse> => {
    const { imageBytes, format } =
      await this.dao.downloadProductImage(imageUrl);
    const imageAnalysis = await this.dao.performImageAnalysis(
      imageBytes,
      format,
      this.buildImageAnalysisToolConfig()
    );
    const approvalStatus = this.determineImageApprovalStatus(imageAnalysis);

    return {
      result: approvalStatus.result,
      note: approvalStatus.note,
      imageResult: {
        shouldBeRejected: approvalStatus.shouldBeRejected,
        weight: imageAnalysis.weightKg,
        hasDimensions: imageAnalysis.hasDimensions,
        description: imageAnalysis.description
      }
    };
  };

  buildImageAnalysisToolConfig = () => ({
    tools: [
      {
        toolSpec: {
          name: "image_analysis",
          description: "Analizar imagen de producto para proceso de aprobación",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description:
                    "Descripción detallada de lo que se ve en la imagen del producto"
                },
                isProhibited: {
                  type: "boolean",
                  description:
                    "Verdadero si el producto pertenece a categorías prohibidas o contiene contenido no permitido"
                },
                prohibitedReason: {
                  type: "string",
                  description:
                    "Razón específica por la cual el producto está prohibido (solo si isProhibited es true)"
                },
                weightKg: {
                  type: "number",
                  description:
                    "Peso en kilogramos extraído de etiquetas o texto visible en la imagen, usar 0 si no hay peso visible"
                },
                hasDimensions: {
                  type: "boolean",
                  description:
                    "Verdadero SOLO si se ven dimensiones ≥25cm que indiquen producto mediano/grande. Ejemplos SÍ: 90cm, 1.5m, 30 pulgadas. Ejemplos NO: 5cm, 44mm, 15cm. Ignora códigos de modelo."
                }
              },
              required: [
                "description",
                "isProhibited",
                "weightKg",
                "hasDimensions"
              ]
            }
          }
        }
      }
    ],
    toolChoice: { tool: { name: "image_analysis" } }
  });

  buildNameAnalysisToolConfig = () => ({
    tools: [
      {
        toolSpec: {
          name: "name_analysis",
          description: "Analizar nombre de producto para proceso de aprobación",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                semanticRelevance: {
                  type: "number",
                  description:
                    "Puntuación de relevancia semántica: 0=sin relación, 25-35=poca relación, 55-65=moderada, 75-85=buena, 90-100=excelente coincidencia entre nombre e imagen"
                },
                shouldBeRejected: {
                  type: "boolean",
                  description:
                    "Verdadero si el nombre contiene contenido prohibido o referencias a categorías no permitidas, solo del listado proporcionado"
                },
                hasDimensions: {
                  type: "boolean",
                  description:
                    "Verdadero SOLO si el nombre incluye dimensiones ≥25cm que indiquen producto mediano/grande. Ejemplos SÍ: 90cm, 1.5m, 30 pulgadas. Ejemplos NO: 5cm, 44mm, 15cm."
                },
                weight: {
                  type: "number",
                  description:
                    "Peso en kilogramos extraído del nombre del producto, usar 0 si no se menciona peso"
                }
              },
              required: [
                "semanticRelevance",
                "shouldBeRejected",
                "hasDimensions",
                "weight"
              ]
            }
          }
        }
      }
    ],
    toolChoice: { tool: { name: "name_analysis" } }
  });

  buildCategoryAnalysisToolConfig = () => ({
    tools: [
      {
        toolSpec: {
          name: "category_analysis",
          description:
            "Analizar categoría de producto para proceso de aprobación",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                semanticRelevance: {
                  type: "number",
                  description:
                    "Puntuación de relevancia semántica: 0=sin relación, 25-35=poca relación, 55-65=moderada, 75-85=buena, 90-100=excelente coincidencia entre categoría e imagen"
                },
                suggestedCategory: {
                  type: "object",
                  description:
                    "Categoría más apropiada seleccionada de la lista disponible",
                  properties: {
                    idProdFormat: {
                      type: "number",
                      description: "ID numérico de la categoría sugerida"
                    },
                    prodFormatName: {
                      type: "string",
                      description: "Nombre de la categoría sugerida"
                    }
                  },
                  required: ["idProdFormat", "prodFormatName"]
                }
              },
              required: ["semanticRelevance", "suggestedCategory"]
            }
          }
        }
      }
    ],
    toolChoice: { tool: { name: "category_analysis" } }
  });

  buildDescriptionAnalysisToolConfig = () => ({
    tools: [
      {
        toolSpec: {
          name: "description_analysis",
          description:
            "Analizar descripción de producto para proceso de aprobación",
          inputSchema: {
            json: {
              type: "object",
              properties: {
                semanticRelevance: {
                  type: "number",
                  description:
                    "Puntuación de relevancia semántica: 0=sin relación, 25-35=poca relación, 55-65=moderada, 75-85=buena, 90-100=excelente coincidencia entre descripción e imagen"
                },
                shouldBeRejected: {
                  type: "boolean",
                  description:
                    "Verdadero si la descripción contiene contenido prohibido o referencias a categorías no permitidas, solo del listado proporcionado"
                },
                hasDimensions: {
                  type: "boolean",
                  description:
                    "Verdadero SOLO si la descripción incluye dimensiones ≥25cm que indiquen producto mediano/grande. Ejemplos SÍ: 90cm, 1.5m, 30 pulgadas. Ejemplos NO: 5cm, 44mm, 15cm."
                },
                weight: {
                  type: "number",
                  description:
                    "Peso en kilogramos extraído de la descripción del producto, usar 0 si no se menciona peso"
                }
              },
              required: [
                "semanticRelevance",
                "shouldBeRejected",
                "hasDimensions",
                "weight"
              ]
            }
          }
        }
      }
    ],
    toolChoice: { tool: { name: "description_analysis" } }
  });
}

export default Model;
