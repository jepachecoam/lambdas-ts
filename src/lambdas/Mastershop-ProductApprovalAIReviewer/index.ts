import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import axios from "axios";
import { fileTypeFromBuffer } from "file-type";

import httpResponse from "../../shared/responses/http";
import {
  AnalysisResponse,
  BedrockAnalysis,
  ICategoryResult,
  IDescriptionResult,
  ImageAnalysisResponse,
  INameResult
} from "./types";

const downloadImage = async (imageUrl: string) => {
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

const createImageAnalysisToolConfig = () => ({
  tools: [
    {
      toolSpec: {
        name: "image_analysis",
        description: "Analyze product image for approval process",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              description: { type: "string" },
              isProhibited: { type: "boolean" },
              prohibitedReason: { type: "string" },
              weightKg: {
                type: "number",
                description:
                  "Weight in kg from visible labels, 0 if no weight visible"
              },
              hasDimensions: {
                type: "boolean",
                description:
                  "True if any spatial dimensions are visible in the image (length, width, height, diameter, etc. in any unit like meters, cm, inches, feet)"
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

const createNameAnalysisToolConfig = () => ({
  tools: [
    {
      toolSpec: {
        name: "name_analysis",
        description: "Analyze product name for approval process",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              semanticRelevance: {
                type: "number",
                description: "Semantic relevance from 0 to 100"
              },
              shouldBeRejected: { type: "boolean" },
              hasDimensions: { type: "boolean" },
              weight: { type: "number" }
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

const createCategoryAnalysisToolConfig = () => ({
  tools: [
    {
      toolSpec: {
        name: "category_analysis",
        description: "Analyze product category for approval process",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              semanticRelevance: {
                type: "number",
                description: "Semantic relevance from 0 to 100"
              },
              suggestedCategory: {
                type: "object",
                properties: {
                  idProdFormat: { type: "number" },
                  prodFormatName: { type: "string" }
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

const createDescriptionAnalysisToolConfig = () => ({
  tools: [
    {
      toolSpec: {
        name: "description_analysis",
        description: "Analyze product description for approval process",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              semanticRelevance: {
                type: "number",
                description: "Semantic relevance from 0 to 100"
              },
              shouldBeRejected: { type: "boolean" },
              hasDimensions: { type: "boolean" },
              weight: { type: "number" }
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

const createAnalysisPrompt = (): string => `
Analyze this product image in detail. Describe what you see and check for prohibited content.

PROHIBITED CATEGORIES:
1. Alcohol and tobacco (liquor, wine, beer, cigarettes, vapes)
2. Drugs and paraphernalia (illegal substances, drug accessories)
3. Weapons and ammunition (firearms, knives except kitchen knives, explosives) - TOYS ARE ALLOWED
4. Dangerous materials (flammable, toxic, industrial chemicals)
5. Animals and animal products (live/dead animals, organs)
6. Adult content (sexual toys, explicit content) - sexual supplements are allowed
7. Financial services
8. Medical/pharmaceutical products (medicine, not supplements)
9. Violence/discrimination promoting content
10. Weapons (knives except kitchen, grenades) - TOYS ARE ALLOWED

TASKS:
1. Provide detailed description of the product in the image
2. Check if it belongs to prohibited categories (distinguish toys from real items)
3. WEIGHT EXTRACTION: Look carefully for any weight information on labels, packaging, or text in the image. Extract numbers with units like:
   - kg, g, gramos, kilogramos
   - lb, lbs, pounds, libras
   - oz, ounces, onzas
   Convert everything to kg (1 lb = 0.453592 kg, 1 oz = 0.0283495 kg). If NO weight is visible anywhere in the image, use 0.
4. DIMENSIONS DETECTION: Look for any spatial measurements visible in the image such as:
   - Length, width, height (1.90m, 90cm, 5 feet, 12 inches)
   - Diameter, radius (30cm diameter)
   - Any measurement that indicates physical size or space
   - Text showing dimensions like "1m x 50cm" or "24 inches"
   Set hasDimensions to true if ANY spatial measurement is visible, false if none.

Use the tool to provide structured analysis.`;

const createNameAnalysisPrompt = (
  imageDescription: string,
  name: string
): string => `
Analyze the product name and compare it with the image description.

IMAGE DESCRIPTION: "${imageDescription}"
PRODUCT NAME: "${name}"

PROHIBITED CATEGORIES:
1. Alcohol and tobacco (liquor, wine, beer, cigarettes, vapes)
2. Drugs and paraphernalia (illegal substances, drug accessories)
3. Weapons and ammunition (firearms, knives except kitchen knives, explosives) - TOYS ARE ALLOWED
4. Dangerous materials (flammable, toxic, industrial chemicals)
5. Animals and animal products (live/dead animals, organs)
6. Adult content (sexual toys, explicit content) - sexual supplements are allowed
7. Financial services
8. Medical/pharmaceutical products (medicine, not supplements)
9. Violence/discrimination promoting content
10. Weapons (knives except kitchen, grenades) - TOYS ARE ALLOWED

TASKS:
- semanticRelevance: Rate 0-100 how well the product name matches the image description
- shouldBeRejected: Check if name contains prohibited content (distinguish toys from real items)
- hasDimensions: Check if name contains spatial measurements (1.90m, 90cm, 5 feet, 12 inches, diameter, etc.)
- weight: Extract weight from name and convert to kg (1 lb = 0.453592 kg, 1 oz = 0.0283495 kg). Use 0 if no weight found

Use the tool to provide structured analysis.`;

const createCategoryAnalysisPrompt = (
  imageDescription: string,
  category: string
): string => `
Analyze the product category and compare it with the image description.

IMAGE DESCRIPTION: "${imageDescription}"
PRODUCT CATEGORY: "${category}"

AVAILABLE CATEGORIES (select the most appropriate):
- {idProdFormat: 3, prodFormatName: "Salud, belleza y cuidado personal"}
- {idProdFormat: 4, prodFormatName: "Hogar, Muebles, Cocina"}
- {idProdFormat: 5, prodFormatName: "Tecnología y electrodomesticos"}
- {idProdFormat: 6, prodFormatName: "Moda, Ropa y Accesorios"}
- {idProdFormat: 7, prodFormatName: "Relojes y Joyas"}
- {idProdFormat: 8, prodFormatName: "Animales y Mascotas"}
- {idProdFormat: 9, prodFormatName: "Bebes, juegos y juguetes"}
- {idProdFormat: 10, prodFormatName: "Deportes y Fitness"}
- {idProdFormat: 31, prodFormatName: "Vehículos"}
- {idProdFormat: 32, prodFormatName: "Liberías y papeleria"}
- {idProdFormat: 34, prodFormatName: "Herramientas"}
- {idProdFormat: 35, prodFormatName: "Otros"}

TASKS:
- semanticRelevance: Rate 0-100 how well the provided category matches the image description
- suggestedCategory: Select the most appropriate category from the available list. If the provided category is correct according to the image, suggest the same. If incorrect, suggest the correct one.

Use the tool to provide structured analysis.`;

const createDescriptionAnalysisPrompt = (
  imageDescription: string,
  description: string
): string => `
Analyze the product description and compare it with the image description.

IMAGE DESCRIPTION: "${imageDescription}"
PRODUCT DESCRIPTION: "${description}"

PROHIBITED CATEGORIES:
1. Alcohol and tobacco (liquor, wine, beer, cigarettes, vapes)
2. Drugs and paraphernalia (illegal substances, drug accessories)
3. Weapons and ammunition (firearms, knives except kitchen knives, explosives) - TOYS ARE ALLOWED
4. Dangerous materials (flammable, toxic, industrial chemicals)
5. Animals and animal products (live/dead animals, organs)
6. Adult content (sexual toys, explicit content) - sexual supplements are allowed
7. Financial services
8. Medical/pharmaceutical products (medicine, not supplements)
9. Violence/discrimination promoting content
10. Weapons (knives except kitchen, grenades) - TOYS ARE ALLOWED

TASKS:
- semanticRelevance: Rate 0-100 how well the product description matches the image description
- shouldBeRejected: Check if description contains prohibited content (distinguish toys from real items)
- hasDimensions: Check if description contains spatial measurements (1.90m, 90cm, 5 feet, 12 inches, diameter, etc.)
- weight: Extract weight from description and convert to kg (1 lb = 0.453592 kg, 1 oz = 0.0283495 kg). Use 0 if no weight found

Use the tool to provide structured analysis.`;

const createImageAnalysisPrompt = async (
  client: BedrockRuntimeClient,
  imageBytes: Uint8Array,
  imageFormat: "jpeg" | "png" | "gif" | "webp"
): Promise<BedrockAnalysis> => {
  const command = new ConverseCommand({
    modelId: "amazon.nova-lite-v1:0",
    messages: [
      {
        role: "user",
        content: [
          { text: createAnalysisPrompt() },
          {
            image: {
              format: imageFormat,
              source: { bytes: imageBytes }
            }
          }
        ]
      }
    ],
    toolConfig: createImageAnalysisToolConfig(),
    inferenceConfig: {
      maxTokens: 2000,
      temperature: 0.1
    }
  });

  const response = await client.send(command);

  const usage = response.usage;
  console.log("Image Analysis Token Usage:", {
    inputTokens: usage?.inputTokens || 0,
    outputTokens: usage?.outputTokens || 0,
    totalTokens: (usage?.inputTokens || 0) + (usage?.outputTokens || 0)
  });

  const toolUse = response.output?.message?.content?.[0]?.toolUse;
  if (!toolUse) {
    throw new Error("No analysis generated");
  }

  return toolUse.input as unknown as BedrockAnalysis;
};

const analyzeName = async (
  client: BedrockRuntimeClient,
  imageDescription: string,
  name: string
): Promise<INameResult> => {
  const command = new ConverseCommand({
    modelId: "amazon.nova-lite-v1:0",
    messages: [
      {
        role: "user",
        content: [{ text: createNameAnalysisPrompt(imageDescription, name) }]
      }
    ],
    toolConfig: createNameAnalysisToolConfig(),
    inferenceConfig: {
      maxTokens: 1000,
      temperature: 0.1
    }
  });

  const response = await client.send(command);
  console.log("Name Analysis Token Usage:", {
    inputTokens: response.usage?.inputTokens || 0,
    outputTokens: response.usage?.outputTokens || 0
  });

  const toolUse = response.output?.message?.content?.[0]?.toolUse;
  if (!toolUse) throw new Error("No name analysis generated");

  return toolUse.input as unknown as INameResult;
};

const analyzeCategory = async (
  client: BedrockRuntimeClient,
  imageDescription: string,
  category: string
): Promise<ICategoryResult> => {
  const command = new ConverseCommand({
    modelId: "amazon.nova-lite-v1:0",
    messages: [
      {
        role: "user",
        content: [
          { text: createCategoryAnalysisPrompt(imageDescription, category) }
        ]
      }
    ],
    toolConfig: createCategoryAnalysisToolConfig(),
    inferenceConfig: {
      maxTokens: 1000,
      temperature: 0.1
    }
  });

  const response = await client.send(command);
  console.log("Category Analysis Token Usage:", {
    inputTokens: response.usage?.inputTokens || 0,
    outputTokens: response.usage?.outputTokens || 0
  });

  const toolUse = response.output?.message?.content?.[0]?.toolUse;
  if (!toolUse) throw new Error("No category analysis generated");

  return toolUse.input as unknown as ICategoryResult;
};

const analyzeDescription = async (
  client: BedrockRuntimeClient,
  imageDescription: string,
  description: string
): Promise<IDescriptionResult> => {
  const command = new ConverseCommand({
    modelId: "amazon.nova-lite-v1:0",
    messages: [
      {
        role: "user",
        content: [
          {
            text: createDescriptionAnalysisPrompt(imageDescription, description)
          }
        ]
      }
    ],
    toolConfig: createDescriptionAnalysisToolConfig(),
    inferenceConfig: {
      maxTokens: 1000,
      temperature: 0.1
    }
  });

  const response = await client.send(command);
  console.log("Description Analysis Token Usage:", {
    inputTokens: response.usage?.inputTokens || 0,
    outputTokens: response.usage?.outputTokens || 0
  });

  const toolUse = response.output?.message?.content?.[0]?.toolUse;
  if (!toolUse) throw new Error("No description analysis generated");

  return toolUse.input as unknown as IDescriptionResult;
};

const determineImgApprovalStatus = (analysis: BedrockAnalysis) => {
  const shouldBeRejected = analysis.isProhibited;
  const shouldBeReviewed =
    !shouldBeRejected && (analysis.weightKg > 1 || analysis.hasDimensions);

  if (shouldBeRejected) {
    return {
      result: "rejected" as const,
      note: analysis.prohibitedReason || "Prohibited content detected",
      shouldBeRejected: true,
      shouldBeReviewed: false
    };
  }

  if (shouldBeReviewed) {
    const reasons = [];
    if (analysis.weightKg > 1) {
      reasons.push(`Weight over 1kg: ${analysis.weightKg}kg`);
    }
    if (analysis.hasDimensions) reasons.push("Dimensions detected");

    return {
      result: "underReview" as const,
      note: reasons.join(", "),
      shouldBeRejected: false,
      shouldBeReviewed: true
    };
  }

  return {
    result: "approved" as const,
    note: "Image approved",
    shouldBeRejected: false,
    shouldBeReviewed: false
  };
};

const analyzeImage = async (
  imageUrl: string
): Promise<ImageAnalysisResponse> => {
  const client = new BedrockRuntimeClient({ region: "us-east-1" });

  const { imageBytes, format } = await downloadImage(imageUrl);
  const analysis = await createImageAnalysisPrompt(client, imageBytes, format);
  const status = determineImgApprovalStatus(analysis);

  return {
    result: status.result,
    note: status.note,
    imgResult: {
      shouldBeRejected: status.shouldBeRejected,
      weight: analysis.weightKg,
      hasDimensions: analysis.hasDimensions,
      description: analysis.description
    }
  };
};

const createDefaultResponse = (): AnalysisResponse => ({
  result: "approved",
  note: "Product approved",
  imgResult: {
    shouldBeRejected: false,
    weight: 0,
    hasDimensions: false,
    description: ""
  },
  nameResult: {
    semanticRelevance: 0,
    shouldBeRejected: false,
    hasDimensions: false,
    weight: 0
  },
  categoryResult: {
    semanticRelevance: 0,
    suggestedCategory: {
      idProdFormat: 0,
      prodFormatName: ""
    }
  },
  descriptionResult: {
    semanticRelevance: 0,
    shouldBeRejected: false,
    hasDimensions: false,
    weight: 0
  }
});

export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    const { imageUrl, name, category, description } = event;

    if (!imageUrl || !name || !category || !description) {
      return httpResponse({
        statusCode: 400,
        body: {
          error: "imageUrl, name, category, and description are required"
        }
      });
    }

    const result = createDefaultResponse();
    let finalResult = "approved";
    let finalNote = "Product approved";

    // Step 1: Analyze image
    const resultImg = await analyzeImage(imageUrl);
    result.imgResult = resultImg.imgResult;

    if (resultImg.result === "rejected") {
      finalResult = "rejected";
      finalNote = resultImg.note;
    } else if (resultImg.result === "underReview") {
      finalResult = "underReview";
      finalNote = resultImg.note;
    }

    // Step 2: If image is approved, proceed with text analysis
    if (resultImg.result === "approved") {
      const client = new BedrockRuntimeClient({ region: "us-east-1" });

      // Analyze name
      const nameResult = await analyzeName(
        client,
        resultImg.imgResult.description,
        name
      );
      result.nameResult = nameResult;

      if (nameResult.shouldBeRejected) {
        finalResult = "rejected";
        finalNote = "Name contains prohibited content";
      } else if (nameResult.weight > 1 || nameResult.hasDimensions) {
        if (finalResult !== "rejected") {
          finalResult = "underReview";
          finalNote = "Name contains weight/dimensions";
        }
      }

      // Analyze category
      const categoryResult = await analyzeCategory(
        client,
        resultImg.imgResult.description,
        category
      );
      result.categoryResult = categoryResult;

      // Analyze description
      const descriptionResult = await analyzeDescription(
        client,
        resultImg.imgResult.description,
        description
      );
      result.descriptionResult = descriptionResult;

      if (descriptionResult.shouldBeRejected) {
        finalResult = "rejected";
        finalNote = "Description contains prohibited content";
      } else if (
        descriptionResult.weight > 1 ||
        descriptionResult.hasDimensions
      ) {
        if (finalResult !== "rejected") {
          finalResult = "underReview";
          finalNote = "Description contains weight/dimensions";
        }
      }
    }

    result.result = finalResult as "approved" | "rejected" | "underReview";
    result.note = finalNote;

    return httpResponse({
      statusCode: 200,
      body: result
    });
  } catch (error: any) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: { message: "Internal server Error" }
    });
  }
};
