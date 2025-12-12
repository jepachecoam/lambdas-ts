import Dao from "./dao";
import { generateGMFCertificationPDF } from "./pdfGenerator";
import { IPayload } from "./types";

class Model {
  private dao: Dao;
  constructor(dao: Dao) {
    this.dao = dao;
  }
  async buildShippingLabel(payload: IPayload): Promise<any> {
    try {
      const pdfBuffer = await generateGMFCertificationPDF(mockData);
      const base64 = pdfBuffer.toString("base64");

      return {
        success: true,
        data: {
          base64,
          filename: `shipping-label-${mockData.idDocument}.pdf`
        }
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      return {
        success: false,
        message: "Error generating shipping label PDF"
      };
    }
  }
}

const mockData = {
  idDocument: "SL-001234",
  emissionDate: new Date(),
  clientName: "EMPRESA DE ENVIOS S.A.S",
  documentNumber: "NIT: 900.123.456-7",
  invoiceDetails: [
    {
      detail: "Envío paquete - Bogotá a Medellín",
      value: 15000,
      createdAt: new Date()
    },
    {
      detail: "Seguro de mercancía",
      value: 5000,
      createdAt: new Date()
    }
  ],
  total4xMil: 80
};

export default Model;
