import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import axios from "axios";
import { fileTypeFromBuffer } from "file-type";

import Prompts from "./prompts";
import {
  BedrockImageAnalysis,
  CategoryAnalysisResult,
  DescriptionAnalysisResult,
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
    imageBytes: Uint8Array,
    imageFormat: "jpeg" | "png" | "gif" | "webp",
    toolConfig: any
  ): Promise<BedrockImageAnalysis> => {
    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      messages: [
        {
          role: "user",
          content: [
            { text: Prompts.buildImageAnalysisPrompt() },
            {
              image: {
                format: imageFormat,
                source: { bytes: imageBytes }
              }
            }
          ]
        }
      ],
      toolConfig,
      inferenceConfig: {
        maxTokens: 2000,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);

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

    return toolUse.input as unknown as BedrockImageAnalysis;
  };

  performNameAnalysis = async (
    imageDescription: string,
    productName: string,
    toolConfig: any
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
      toolConfig,
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);
    console.log("Name Analysis Token Usage:", {
      inputTokens: response.usage?.inputTokens || 0,
      outputTokens: response.usage?.outputTokens || 0
    });

    const toolUse = response.output?.message?.content?.[0]?.toolUse;
    if (!toolUse) throw new Error("No name analysis generated");

    return toolUse.input as unknown as NameAnalysisResult;
  };

  performCategoryAnalysis = async (
    imageDescription: string,
    productCategory: string,
    toolConfig: any
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
      toolConfig,
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);
    console.log("Category Analysis Token Usage:", {
      inputTokens: response.usage?.inputTokens || 0,
      outputTokens: response.usage?.outputTokens || 0
    });

    const toolUse = response.output?.message?.content?.[0]?.toolUse;
    if (!toolUse) throw new Error("No category analysis generated");

    return toolUse.input as unknown as CategoryAnalysisResult;
  };

  performDescriptionAnalysis = async (
    imageDescription: string,
    productDescription: string,
    toolConfig: any
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
      toolConfig,
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.1
      }
    });

    const response = await this.bedrock.send(command);
    console.log("Description Analysis Token Usage:", {
      inputTokens: response.usage?.inputTokens || 0,
      outputTokens: response.usage?.outputTokens || 0
    });

    const toolUse = response.output?.message?.content?.[0]?.toolUse;
    if (!toolUse) throw new Error("No description analysis generated");

    return toolUse.input as unknown as DescriptionAnalysisResult;
  };
}

export default Dao;
