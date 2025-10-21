import {
  BedrockRuntimeClient,
  ConverseCommand
} from "@aws-sdk/client-bedrock-runtime";
import axios from "axios";

import httpResponse from "../../shared/responses/http";

interface EventInput {
  url: string;
}

interface StructuredOutput {
  historia: string;
  categoria: string;
  personajes: string[];
}

export const handler = async (
  event: EventInput,
  _context: unknown
): Promise<any> => {
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

    const command = new ConverseCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      messages: [
        {
          role: "user",
          content: [
            {
              text: "Analiza esta imagen y crea una historia creativa basada en lo que ves. Incluye personajes, trama y categoría."
            },
            {
              image: {
                format: "jpeg",
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

    const structuredResponse = toolUse.input as unknown as StructuredOutput;
    console.log("Structured Response:", structuredResponse);

    return httpResponse({
      statusCode: 200,
      body: structuredResponse
    });
  } catch (error: any) {
    console.error("Error:", error);
    return httpResponse({
      statusCode: 500,
      body: { error: error.message }
    });
  }
};
