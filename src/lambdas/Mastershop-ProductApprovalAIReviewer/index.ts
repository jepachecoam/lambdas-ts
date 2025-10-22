import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import axios from "axios";

import httpResponse from "../../shared/responses/http";

export const handler = async (event: any, _context: unknown): Promise<any> => {
  try {
    console.log("Event =>>>", event);

    if (!event.url) {
      return httpResponse({
        statusCode: 400,
        body: { error: "url is required" }
      });
    }

    const client = new BedrockRuntimeClient({ region: "us-east-1" });

    const toolConfig = {
      tools: [
        {
          toolSpec: {
            name: "generate_story_analysis",
            description: "Genera análisis estructurado de historia",
            inputSchema: {
              json: {
                type: "object",
                properties: {
                  historia: {
                    type: "string",
                    description: "Descripción de la historia"
                  },
                  categoria: {
                    type: "string",
                    description: "Categoría o género de la historia"
                  },
                  personajes: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de personajes principales"
                  }
                },
                required: ["historia", "categoria", "personajes"]
              }
            }
          }
        }
      ],
      toolChoice: { tool: { name: "generate_story_analysis" } }
    };

    const imageResponse = await axios.get(event.url, {
      responseType: "arraybuffer"
    });
    const imageBytes = new Uint8Array(imageResponse.data);

    // Detect image format from content-type header
    const contentType = imageResponse.headers["content-type"] || "";
    let imageFormat: "jpeg" | "png" | "gif" | "webp" = "jpeg";

    if (contentType.includes("png")) {
      imageFormat = "png";
    } else if (contentType.includes("gif")) {
      imageFormat = "gif";
    } else if (contentType.includes("webp")) {
      imageFormat = "webp";
    }

    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      messages: [
        {
          role: "user",
          content: [
            {
              text: "Analiza esta imagen y crea una historia creativa basada en lo que ves, debe ser minimo 100 palabras"
            },
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
        maxTokens: 1000,
        temperature: 0.7
      }
    });

    const response = await client.send(command);
    const toolUse = response.output?.message?.content?.[0]?.toolUse;

    if (!toolUse) {
      return httpResponse({
        statusCode: 500,
        body: { error: "No tool use in response" }
      });
    }

    const structuredResponse = toolUse.input;

    console.log("Structured Response:", structuredResponse);

    return httpResponse({
      statusCode: 200,
      body: structuredResponse
    });
  } catch (error: any) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: { message: "Internal server Error" }
    });
  }
};
