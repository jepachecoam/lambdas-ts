import { generateStandarShippingLabelPDF } from "./pdf/standar";
import { generateStickerShippingLabelPDF } from "./pdf/sticker";
import { ShippingLabelData } from "./types";

class Model {
  async buildShippingLabel(payload: ShippingLabelData): Promise<any> {
    try {
      let pdfBuffer = null;
      if (payload.format === "standard") {
        pdfBuffer = await generateStandarShippingLabelPDF(payload);
      } else {
        pdfBuffer = await generateStickerShippingLabelPDF(payload);
      }
      const base64 = pdfBuffer.toString("base64");

      return {
        success: true,
        data: base64
      };
    } catch (error) {
      console.error("Error generating shipping label PDF:", error);
      return {
        success: false,
        data: null
      };
    }
  }
}

export default Model;
