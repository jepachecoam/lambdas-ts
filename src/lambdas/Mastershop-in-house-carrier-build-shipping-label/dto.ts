import { ShippingLabelDataSchema } from "./types";

const splitString = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
};

const parseEvent = ({ event }: any) => {
  try {
    const body =
      typeof event.body === "object"
        ? event.body
        : JSON.parse(event.body || "{}");

    const result = ShippingLabelDataSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        message: `Validation errors: ${errors.join(", ")}`,
        data: null
      };
    }

    const environment = event?.requestContext?.stage || "dev";

    return {
      message: "",
      data: { ...result },
      environment
    };
  } catch (error) {
    console.error("Error parsing event:", error);
    return { data: null, message: "Invalid JSON format in event.body" };
  }
};

export default { parseEvent, splitString };
