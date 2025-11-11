import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import axios from "axios";
import { fileTypeFromBuffer } from "file-type";

import Prompts from "./prompts";
import {
  CategoryAnalysisResult,
  DescriptionAnalysisResult,
  ImageAnalysisResult,
  NameAnalysisResult
} from "./types";

class Dao {
  private bedrock = new BedrockRuntimeClient({ region: "us-east-1" });

  downloadProductImage = async (imageUrl: string) => {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBytes = new Uint8Array(response.data);

    const fileType = await fileTypeFromBuffer(imageBytes);
    const format =
      fileType?.ext === "jpg"
        ? "jpeg"
        : (fileType?.ext as "jpeg" | "png" | "gif" | "webp") || "jpeg";

    console.log(`Image URL: ${imageUrl}`);
    console.log(`Detected format: ${format}`);

    return { imageBytes, format };
  };

  performImageAnalysis = async (
    imageUrl: string
  ): Promise<ImageAnalysisResult> => {
    const { imageBytes, format } = await this.downloadProductImage(imageUrl);

    const command = new ConverseCommand({
      modelId: "amazon.nova-pro-v1:0",
      messages: [
        {
          role: "user",
          content: [
            { text: Prompts.buildImageAnalysisPrompt() },
            {
              image: {
                format: format,
                source: { bytes: imageBytes }
              }
            }
          ]
        }
      ],
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: "image_analysis",
              description:
                "Analizar imagen de producto para proceso de aprobación",
              inputSchema: {
                json: {
                  type: "object",
                  properties: {
                    description: {
                      type: "string",
                      description:
                        "Descripción detallada de lo que se ve en la imagen del producto"
                    },
                    isBlacklisted: {
                      type: "boolean",
                      description:
                        "Verdadero si el producto pertenece a categorías prohibidas o contiene contenido no permitido, o no es producto fisico o no se lo ve claramente"
                    },
                    weightKg: {
                      type: "number",
                      description:
                        "Peso en kilogramos extraído de etiquetas o texto visible en la imagen, usar 0 si no hay peso visible"
                    },
                    hasDimensions: {
                      type: "boolean",
                      description:
                        "Verdadero SOLO si se ven dimensiones ≥25cm que indiquen producto mediano/grande o Si hace parte de las categorias agro indicadas"
                    }
                  },
                  required: [
                    "description",
                    "isBlacklisted",
                    "weightKg",
                    "hasDimensions"
                  ]
                }
              }
            }
          }
        ],
        toolChoice: { tool: { name: "image_analysis" } }
      },
      inferenceConfig: {
        maxTokens: 3500,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);

    const toolUse = response.output?.message?.content?.[0]?.toolUse;
    if (!toolUse) {
      throw new Error("No analysis generated");
    }

    return toolUse.input as unknown as ImageAnalysisResult;
  };

  performNameAnalysis = async (
    imageDescription: string,
    productName: string
  ): Promise<NameAnalysisResult> => {
    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      messages: [
        {
          role: "user",
          content: [
            {
              text: Prompts.buildNameAnalysisPrompt(
                imageDescription,
                productName
              )
            }
          ]
        }
      ],
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: "name_analysis",
              description:
                "Analizar nombre de producto para proceso de aprobación",
              inputSchema: {
                json: {
                  type: "object",
                  properties: {
                    semanticRelevance: {
                      type: "number",
                      description:
                        "Puntuación de relevancia semántica: 0=sin relación, 25-35=poca relación, 55-65=moderada, 75-85=buena, 90-100=excelente coincidencia entre nombre e imagen"
                    },
                    isBlacklisted: {
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
                    "isBlacklisted",
                    "hasDimensions",
                    "weight"
                  ]
                }
              }
            }
          }
        ],
        toolChoice: { tool: { name: "name_analysis" } }
      },
      inferenceConfig: {
        maxTokens: 3500,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);

    const toolUse = response.output?.message?.content?.[0]?.toolUse;
    if (!toolUse) throw new Error("No name analysis generated");

    return toolUse.input as unknown as NameAnalysisResult;
  };

  performCategoryAnalysis = async (
    imageDescription: string,
    productCategory: string
  ): Promise<CategoryAnalysisResult> => {
    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      messages: [
        {
          role: "user",
          content: [
            {
              text: Prompts.buildCategoryAnalysisPrompt(
                imageDescription,
                productCategory
              )
            }
          ]
        }
      ],
      toolConfig: {
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
      },
      inferenceConfig: {
        maxTokens: 3500,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);

    const toolUse = response.output?.message?.content?.[0]?.toolUse;
    if (!toolUse) throw new Error("No category analysis generated");

    return toolUse.input as unknown as CategoryAnalysisResult;
  };

  performDescriptionAnalysis = async (
    imageDescription: string,
    productDescription: string
  ): Promise<DescriptionAnalysisResult> => {
    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      messages: [
        {
          role: "user",
          content: [
            {
              text: Prompts.buildDescriptionAnalysisPrompt(
                imageDescription,
                productDescription
              )
            }
          ]
        }
      ],
      toolConfig: {
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
                    isBlacklisted: {
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
                    "isBlacklisted",
                    "hasDimensions",
                    "weight"
                  ]
                }
              }
            }
          }
        ],
        toolChoice: { tool: { name: "description_analysis" } }
      },
      inferenceConfig: {
        maxTokens: 3500,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);

    const toolUse = response.output?.message?.content?.[0]?.toolUse;
    if (!toolUse) throw new Error("No description analysis generated");

    return toolUse.input as unknown as DescriptionAnalysisResult;
  };
}

export default Dao;
