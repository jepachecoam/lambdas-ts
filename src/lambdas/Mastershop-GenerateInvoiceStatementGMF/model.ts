import Dao from "./dao";
import { generateGMFCertificationPDF } from "./pdfGenerator";
import { CustomerDeduplicationEnvs } from "./types";

class Model {
  private dao: Dao;
  private environment: string;
  private envs: CustomerDeduplicationEnvs;

  constructor(environment: string, envs: CustomerDeduplicationEnvs) {
    this.dao = new Dao(environment);
    this.envs = envs;
    this.environment = environment;
  }

  async getGmfStatement({ idInvoice }: { idInvoice: number }): Promise<Buffer> {
    const [invoice, invoiceDetails]: any = await Promise.all([
      this.dao.getInvoice({ idInvoice }),
      this.dao.getInvoiceDetail({ idInvoice })
    ]);

    if (!invoice || !invoiceDetails || !invoiceDetails.length) {
      throw new Error("Invoice or invoice details not found");
    }

    const pdfData = {
      idDocument: `${idInvoice}`,
      emissionDate: new Date(invoice.createdAt),
      clientName: invoice.name,
      documentNumber: `${invoice.documentType}-${invoice.documentNumber}`,
      invoiceDetails: invoiceDetails.map((detail: any) => ({
        detail: detail.detail,
        value: detail.value,
        createdAt: detail.createdAt
      })),
      total4xMil: invoice.totalValue
    };

    return await generateGMFCertificationPDF(pdfData);
  }
}

export default Model;
