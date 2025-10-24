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
  ImageAnalysis,
  ImageAnalysisResponse
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

const createBedrockToolConfig = () => ({
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

const callBedrockAnalysis = async (
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
    toolConfig: createBedrockToolConfig(),
    inferenceConfig: {
      maxTokens: 2000,
      temperature: 0.1
    }
  });

  const response = await client.send(command);

  const usage = response.usage;
  console.log("Token Usage:", {
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
    note: "Product approved",
    shouldBeRejected: false,
    shouldBeReviewed: false
  };
};

const analyzeImage = async (
  imageUrl: string
): Promise<ImageAnalysisResponse> => {
  const client = new BedrockRuntimeClient({ region: "us-east-1" });

  const { imageBytes, format } = await downloadImage(imageUrl);
  const analysis = await callBedrockAnalysis(client, imageBytes, format);
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

interface result extends AnalysisResponse {
  imgResult: ImageAnalysis;
}

export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    const { imageUrl } = event;

    if (!imageUrl) {
      return httpResponse({
        statusCode: 400,
        body: {
          error: "imageUrl is required"
        }
      });
    }

    const _result: result = {
      result: "approved",
      note: "Default response",
      imgResult: {
        shouldBeRejected: false,
        weight: 0,
        hasDimensions: false,
        description: "Default description"
      }
    };

    const resultImg = await analyzeImage(imageUrl);

    return httpResponse({
      statusCode: 200,
      body: resultImg
    });
  } catch (error: any) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: { message: "Internal server Error" }
    });
  }
};
